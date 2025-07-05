import semanticLinks from '../../data/semantic_links_sample.json';
import materialLinks from '../../data/material_alt_links_sample.json';

export interface LinkSuggestion {
  code: string;
  score: number;
}

function getLinks(db: any, normalized: string): LinkSuggestion[] {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const suggestions = (db as Record<string, LinkSuggestion[]>)[normalized] ?? [];
  return suggestions;
}

export function getSemanticSuggestions(code: string): LinkSuggestion[] {
  const normalized = code.replace(/\D/g, '').padEnd(8, '0').slice(0, 8);
  return getLinks(semanticLinks, normalized);
}

export function getMaterialSuggestions(code: string): LinkSuggestion[] {
  const normalized = code.replace(/\D/g, '').padEnd(8, '0').slice(0, 8);
  return getLinks(materialLinks, normalized);
}

export function getAllTariffSuggestions(code: string): LinkSuggestion[] {
  const byCode: Record<string, LinkSuggestion> = {};
  getSemanticSuggestions(code).forEach((s) => {
    byCode[s.code] = { code: s.code, score: s.score };
  });
  getMaterialSuggestions(code).forEach((s) => {
    if (byCode[s.code]) {
      // average scores if duplicate
      byCode[s.code].score = Number(((byCode[s.code].score + s.score) / 2).toFixed(3));
    } else {
      byCode[s.code] = { code: s.code, score: s.score };
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
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getAllTariffSuggestions(code));
    }, 300);
  });
}