import links from '../../data/semantic_links_sample.json';

export interface LinkSuggestion {
  code: string;
  score: number;
}

export function getTariffSuggestions(htsCode: string): LinkSuggestion[] {
  const normalized = htsCode.replace(/\D/g, '').padEnd(8, '0').slice(0, 8);
  // @ts-expect-error -- dynamic JSON key access
  const suggestions: LinkSuggestion[] | undefined = links[normalized];
  return suggestions ?? [];
}