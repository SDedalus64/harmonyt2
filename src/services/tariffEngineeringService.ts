import tariffEngineeringData from '../../data/tariff_engineering.json';
import semanticLinksData from '../../data/semantic_links.json';
import materialLinksData from '../../data/material_alt_links.json';

export interface TariffEngineeringSuggestion {
  code: string;
  description: string;
  currentDutyRate: number;
  suggestedDutyRate: number;
  savings: number; // percentage points saved
  reason: string;
  reasonType: 'NEIGHBOR' | 'MATERIAL' | 'PROCESS' | 'FUNCTION' | 'COMPONENT' | 'SEMANTIC';
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

// Type cast the imported data
const engineeringDB = tariffEngineeringData as Record<string, TariffEngineeringEntry>;

export function getTariffEngineeringSuggestions(code: string): TariffEngineeringSuggestion[] {
  const normalized = code.replace(/\D/g, '').padEnd(8, '0').slice(0, 8);
  
  // First check if we have direct engineering suggestions
  const entry = engineeringDB[normalized];
  if (!entry) return [];
  
  const suggestions: TariffEngineeringSuggestion[] = [];
  
  // Add suggestions from the engineering database (with duty rates)
  for (const suggestion of entry.suggestions) {
    if (suggestion.rateDifference > 0) { // Only show savings opportunities
      suggestions.push({
        code: suggestion.code,
        description: suggestion.description,
        currentDutyRate: entry.dutyRate,
        suggestedDutyRate: suggestion.dutyRate,
        savings: suggestion.rateDifference,
        reason: suggestion.reason,
        reasonType: suggestion.reasonType,
      });
    }
  }
  
  // Also check semantic links for additional opportunities
  const semanticLinks = (semanticLinksData as any)[normalized];
  if (semanticLinks && Array.isArray(semanticLinks)) {
    for (const link of semanticLinks.slice(0, 3)) { // Top 3 semantic matches
      // Check if this semantic match has a different duty rate
      const linkedEntry = engineeringDB[link.code];
      if (linkedEntry && linkedEntry.dutyRate < entry.dutyRate) {
        const savings = entry.dutyRate - linkedEntry.dutyRate;
        if (savings >= 1) { // At least 1% savings
          suggestions.push({
            code: link.code,
            description: linkedEntry.description,
            currentDutyRate: entry.dutyRate,
            suggestedDutyRate: linkedEntry.dutyRate,
            savings,
            reason: link.reason || 'Semantic similarity',
            reasonType: 'SEMANTIC',
          });
        }
      }
    }
  }
  
  // Sort by savings (highest first) and limit to top 10
  return suggestions
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 10);
}

export function getNeighboringCodes(code: string): TariffEngineeringSuggestion[] {
  const normalized = code.replace(/\D/g, '').padEnd(8, '0').slice(0, 8);
  const entry = engineeringDB[normalized];
  if (!entry) return [];
  
  return entry.suggestions
    .filter(s => s.reasonType === 'NEIGHBOR' && s.rateDifference > 0)
    .map(s => ({
      code: s.code,
      description: s.description,
      currentDutyRate: entry.dutyRate,
      suggestedDutyRate: s.dutyRate,
      savings: s.rateDifference,
      reason: s.reason,
      reasonType: s.reasonType as 'NEIGHBOR',
    }))
    .slice(0, 5);
}

export function getMaterialAlternatives(code: string): TariffEngineeringSuggestion[] {
  const normalized = code.replace(/\D/g, '').padEnd(8, '0').slice(0, 8);
  const entry = engineeringDB[normalized];
  if (!entry) return [];
  
  return entry.suggestions
    .filter(s => s.reasonType === 'MATERIAL' && s.rateDifference > 0)
    .map(s => ({
      code: s.code,
      description: s.description,
      currentDutyRate: entry.dutyRate,
      suggestedDutyRate: s.dutyRate,
      savings: s.rateDifference,
      reason: s.reason,
      reasonType: s.reasonType as 'MATERIAL',
    }))
    .slice(0, 5);
}

export async function fetchTariffEngineeringSuggestions(code: string): Promise<TariffEngineeringSuggestion[]> {
  const normalized = code.replace(/\D/g, '');
  if (normalized.length < 6 || normalized.length > 10) {
    throw new Error('Please enter a valid 6–10 digit HTS code.');
  }
  
  // Simulate async for loading state
  return new Promise<TariffEngineeringSuggestion[]>((resolve) => {
    setTimeout(() => {
      resolve(getTariffEngineeringSuggestions(code));
    }, 300);
  });
}