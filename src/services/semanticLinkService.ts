import semanticLinksData from '../../data/semantic_links.json';
import materialLinksData from '../../data/material_alt_links.json';

export interface LinkSuggestion {
  code: string;
  score: number;
  reason?: string;
  reasonType?: 'MATERIAL' | 'PROCESS' | 'ORIGIN' | 'SEMANTIC';
}

function getLinks(db: any, normalized: string): LinkSuggestion[] {
   
  const suggestions = (db as Record<string, LinkSuggestion[]>)[normalized] ?? [];
  return suggestions;
}

export function getSemanticSuggestions(code: string): LinkSuggestion[] {
  const normalized = code.replace(/\D/g, '').padEnd(8, '0').slice(0, 8);
  return getLinks(semanticLinksData, normalized);
}

export function getMaterialSuggestions(code: string): LinkSuggestion[] {
  const normalized = code.replace(/\D/g, '').padEnd(8, '0').slice(0, 8);
  return getLinks(materialLinksData, normalized);
}

export function getAllTariffSuggestions(code: string): LinkSuggestion[] {
  const byCode: Record<string, LinkSuggestion> = {};
  getSemanticSuggestions(code).forEach((s) => {
    byCode[s.code] = { code: s.code, score: s.score, reason: s.reason, reasonType: s.reasonType };
  });
  getMaterialSuggestions(code).forEach((s) => {
    if (byCode[s.code]) {
      // average scores if duplicate
      byCode[s.code].score = Number(((byCode[s.code].score + s.score) / 2).toFixed(3));
    } else {
      byCode[s.code] = { code: s.code, score: s.score, reason: s.reason, reasonType: s.reasonType };
    }
  });
  return Object.values(byCode).sort((a, b) => b.score - a.score);
}

export async function fetchAllTariffSuggestions(code: string): Promise<LinkSuggestion[]> {
  const normalized = code.replace(/\D/g, '');
  if (normalized.length < 6 || normalized.length > 10) {
    throw new Error('Please enter a valid 6–10 digit HTS code.');
  }
  // Simulate async latency to allow loading indicator
  try {
    return await new Promise<LinkSuggestion[]>((resolve) => {
      setTimeout(() => {
        resolve(getAllTariffSuggestions(code));
      }, 300);
    });
  } catch (err) {
    console.error('⚠️ Failed to generate suggestions:', err);
    return [];
  }
}