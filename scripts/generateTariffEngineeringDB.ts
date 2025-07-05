import * as fs from 'fs';
import * as path from 'path';

/**
 * Enhanced tariff engineering database generator that includes:
 * - Duty rates for each HTS code
 * - Neighboring codes (codes that differ by 1-2 digits)
 * - Real tariff engineering opportunities based on rate differences
 * - Classification pivot points
 */

interface TariffEntry {
  hts8: string;
  brief_description: string;
  base_rate?: string;
  special_rate?: string;
  other_rate?: string;
}

interface TariffEngineeringEntry {
  code: string;
  description: string;
  dutyRate: number;
  suggestions: Array<{
    code: string;
    description: string;
    dutyRate: number;
    rateDifference: number;
    reason: string;
    reasonType: 'NEIGHBOR' | 'MATERIAL' | 'PROCESS' | 'FUNCTION' | 'COMPONENT';
  }>;
}

interface TariffEngineeringDB {
  [code: string]: TariffEngineeringEntry;
}

// Parse duty rate from various formats (e.g., "Free", "5%", "5.5%", "$0.37/kg")
function parseDutyRate(rateStr: string | undefined): number {
  if (!rateStr) return 0;
  
  const cleaned = rateStr.trim().toLowerCase();
  
  if (cleaned === 'free' || cleaned === '0%') return 0;
  
  // Extract percentage
  const percentMatch = cleaned.match(/(\d+\.?\d*)%/);
  if (percentMatch) {
    return parseFloat(percentMatch[1]);
  }
  
  // For specific rates (per kg, etc), use a default of 10%
  if (cleaned.includes('$') || cleaned.includes('¢')) {
    return 10; // Default for specific rates
  }
  
  return 0;
}

// Find neighboring codes (differ by last 1-2 digits)
function findNeighboringCodes(code: string, allEntries: Map<string, TariffEntry>): string[] {
  const neighbors: string[] = [];
  const prefix6 = code.substring(0, 6);
  const prefix4 = code.substring(0, 4);
  
  // Find codes with same 6-digit prefix but different last 2 digits
  for (const [otherCode] of allEntries) {
    if (otherCode === code) continue;
    
    if (otherCode.startsWith(prefix6) && otherCode !== code) {
      neighbors.push(otherCode);
    } else if (otherCode.startsWith(prefix4) && !otherCode.startsWith(prefix6)) {
      // Same 4-digit prefix but different at 6-digit level
      neighbors.push(otherCode);
    }
  }
  
  return neighbors;
}

// Identify classification pivot points based on description differences
function identifyPivotPoint(desc1: string, desc2: string): string | null {
  const tokens1 = new Set(desc1.toLowerCase().split(/\s+/));
  const tokens2 = new Set(desc2.toLowerCase().split(/\s+/));
  
  // Find unique tokens in desc2 that aren't in desc1
  const uniqueTokens = [...tokens2].filter(t => !tokens1.has(t) && t.length > 3);
  
  // Common pivot indicators
  const pivotIndicators = {
    'assembled': 'Assembly state',
    'unassembled': 'Assembly state',
    'finished': 'Processing stage',
    'unfinished': 'Processing stage',
    'parts': 'Component vs complete',
    'accessories': 'Main product vs accessory',
    'sets': 'Individual vs set',
    'kit': 'Complete vs kit form',
    'retail': 'Packaging for retail sale',
    'bulk': 'Bulk vs retail packaging',
  };
  
  for (const token of uniqueTokens) {
    if (pivotIndicators[token as keyof typeof pivotIndicators]) {
      return pivotIndicators[token as keyof typeof pivotIndicators];
    }
  }
  
  // Material differences
  const materials = ['plastic', 'leather', 'metal', 'wood', 'cotton', 'rubber', 'glass', 'steel', 'iron', 'aluminum'];
  const mat1 = materials.find(m => tokens1.has(m));
  const mat2 = materials.find(m => tokens2.has(m));
  if (mat1 !== mat2 && mat2) {
    return `Material: ${mat2} instead of ${mat1 || 'other'}`;
  }
  
  return null;
}

function buildTariffEngineeringDB(csvPath: string): TariffEngineeringDB {
  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  
  // Parse CSV and build entry map
  const entries = new Map<string, TariffEntry>();
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parsing (handles quoted fields)
    const fields = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    
    if (fields.length >= 10) {
      const hts8 = fields[0];
      const brief_description = fields[1];
      const mfn_text_rate = fields[5]; // This is the base duty rate
      
      if (/^\d{8}$/.test(hts8)) {
        entries.set(hts8, {
          hts8,
          brief_description: brief_description.replace(/^"|"$/g, ''),
          base_rate: mfn_text_rate,
          special_rate: '',
          other_rate: '',
        });
      }
    }
  }
  
  console.log(`Parsed ${entries.size} tariff entries`);
  
  // Build engineering database
  const db: TariffEngineeringDB = {};
  
  for (const [code, entry] of entries) {
    const dutyRate = parseDutyRate(entry.base_rate);
    const suggestions = [];
    
    // Find neighboring codes
    const neighbors = findNeighboringCodes(code, entries);
    
    for (const neighborCode of neighbors.slice(0, 10)) { // Limit to 10 neighbors
      const neighbor = entries.get(neighborCode);
      if (!neighbor) continue;
      
      const neighborRate = parseDutyRate(neighbor.base_rate);
      const rateDiff = dutyRate - neighborRate;
      
      // Only include if there's a meaningful rate difference
      if (Math.abs(rateDiff) >= 0.5) {
        const pivot = identifyPivotPoint(entry.brief_description, neighbor.brief_description);
        
        suggestions.push({
          code: neighborCode,
          description: neighbor.brief_description,
          dutyRate: neighborRate,
          rateDifference: rateDiff,
          reason: pivot || 'Similar product classification',
          reasonType: (pivot ? 
            (pivot.includes('Material') ? 'MATERIAL' : 
             pivot.includes('Assembly') ? 'PROCESS' :
             pivot.includes('Component') ? 'COMPONENT' : 'FUNCTION') 
            : 'NEIGHBOR') as 'NEIGHBOR' | 'MATERIAL' | 'PROCESS' | 'FUNCTION' | 'COMPONENT',
        });
      }
    }
    
    // Sort by rate difference (biggest savings first)
    suggestions.sort((a, b) => b.rateDifference - a.rateDifference);
    
    if (suggestions.length > 0) {
      db[code] = {
        code,
        description: entry.brief_description,
        dutyRate,
        suggestions: suggestions.slice(0, 8), // Top 8 opportunities
      };
    }
  }
  
  return db;
}

// Consumer goods chapters for filtering
const CONSUMER_CHAPTERS = new Set(['42', '61', '62', '63', '64', '65', '71', '82', '85', '90', '91', '94', '95', '96']);

function main() {
  const args = process.argv.slice(2);
  const csvPath = args[0];
  const outPath = args[1];
  const consumerOnly = args.includes('--consumer');
  
  if (!csvPath || !outPath) {
    console.error('Usage: ts-node generateTariffEngineeringDB.ts <input.csv> <output.json> [--consumer]');
    process.exit(1);
  }
  
  const db = buildTariffEngineeringDB(csvPath);
  
  // Filter to consumer goods if requested
  const finalDb = consumerOnly
    ? Object.fromEntries(
        Object.entries(db)
          .filter(([code]) => CONSUMER_CHAPTERS.has(code.substring(0, 2)))
          .map(([code, entry]) => [
            code,
            {
              ...entry,
              suggestions: entry.suggestions.filter(s => 
                CONSUMER_CHAPTERS.has(s.code.substring(0, 2))
              ) as typeof entry.suggestions,
            },
          ])
          .filter(([, entry]) => (entry as TariffEngineeringEntry).suggestions.length > 0)
      )
    : db;
  
  console.log(`Generated tariff engineering database with ${Object.keys(finalDb).length} entries`);
  
  // Write output
  fs.writeFileSync(outPath, JSON.stringify(finalDb, null, 2), 'utf8');
  console.log(`Tariff engineering database written to ${outPath}`);
}

if (require.main === module) {
  main();
}