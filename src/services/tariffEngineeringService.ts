import tariffEngineeringData from '../../data/tariff_engineering.json';
import semanticLinksData from '../../data/semantic_links.json';
import materialLinksData from '../../data/material_alt_links.json';
import { TariffService } from './tariffService';

export interface TariffEngineeringSuggestion {
  code: string;
  description: string;
  currentDutyRate: number;
  suggestedDutyRate: number;
  savings: number; // percentage points saved
  reason: string;
  reasonType: 'NEIGHBOR' | 'MATERIAL' | 'PROCESS' | 'FUNCTION' | 'COMPONENT' | 'SEMANTIC';
}

export interface CompleteDutyComparison {
  currentCode: string;
  alternativeCode: string;
  alternativeDescription: string;
  engineeringStrategy: string;
  currentDuty: {
    totalAmount: number;
    components: Array<{
      type: string;
      rate: number;
      amount: number;
      label?: string;
    }>;
  };
  alternativeDuty: {
    totalAmount: number;
    components: Array<{
      type: string;
      rate: number;
      amount: number;
      label?: string;
    }>;
  };
  savings: {
    amount: number;
    percentage: number;
    avoidedTariffs: string[];
  };
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
  
  console.log('[TariffEngineering] Looking for suggestions for:', normalized);
  console.log('[TariffEngineering] Database has entries:', Object.keys(engineeringDB).length);
  
  // First check if we have direct engineering suggestions
  const entry = engineeringDB[normalized];
  if (!entry) {
    console.log('[TariffEngineering] No entry found for code:', normalized);
    return [];
  }
  
  console.log('[TariffEngineering] Found entry:', entry);
  const suggestions: TariffEngineeringSuggestion[] = [];
  
  // Add suggestions from the engineering database (with duty rates)
  for (const suggestion of entry.suggestions) {
    if (suggestion.rateDifference > 0) { // Only show savings opportunities
      console.log('[TariffEngineering] Adding suggestion with savings:', suggestion);
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
    console.log('[TariffEngineering] Found semantic links:', semanticLinks);
    for (const link of semanticLinks.slice(0, 3)) { // Top 3 semantic matches
      // Check if this semantic match has a different duty rate
      const linkedEntry = engineeringDB[link.code];
      if (linkedEntry && linkedEntry.dutyRate < entry.dutyRate) {
        const savings = entry.dutyRate - linkedEntry.dutyRate;
        if (savings >= 1) { // At least 1% savings
          console.log('[TariffEngineering] Adding semantic suggestion with savings:', link);
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
  const result = suggestions
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 10);
    
  console.log('[TariffEngineering] Returning suggestions:', result);
  return result;
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

export async function getTariffEngineeringSuggestionsWithDuties(
  htsCode: string,
  countryCode: string,
  declaredValue: number,
  isUSMCAOrigin: boolean = false
): Promise<CompleteDutyComparison[]> {
  // Get base suggestions
  const suggestions = getTariffEngineeringSuggestions(htsCode);
  const tariffService = TariffService.getInstance();
  const results: CompleteDutyComparison[] = [];

  // Get current duty calculation
  const currentDuty = await tariffService.calculateDuty(
    htsCode,
    declaredValue,
    countryCode,
    true, // isReciprocalAdditive
    false, // excludeReciprocalTariff
    isUSMCAOrigin
  );

  if (!currentDuty) return [];

  // For each suggestion, calculate duties and create comparison
  for (const suggestion of suggestions) {
    const alternativeDuty = await tariffService.calculateDuty(
      suggestion.code,
      declaredValue,
      countryCode,
      true,
      false,
      isUSMCAOrigin
    );

    if (!alternativeDuty) continue;

    // Calculate savings
    const savingsAmount = currentDuty.amount - alternativeDuty.amount;
    const savingsPercentage = (savingsAmount / currentDuty.amount) * 100;

    // Determine avoided tariffs by comparing components
    const avoidedTariffs = currentDuty.components
      .filter(current => !alternativeDuty.components.some(alt => 
        alt.type === current.type && alt.rate >= current.rate
      ))
      .map(component => component.label || component.type);

    if (savingsAmount > 0) {
      results.push({
        currentCode: htsCode,
        alternativeCode: suggestion.code,
        alternativeDescription: suggestion.description,
        engineeringStrategy: suggestion.reason,
        currentDuty: {
          totalAmount: currentDuty.amount,
          components: currentDuty.components
        },
        alternativeDuty: {
          totalAmount: alternativeDuty.amount,
          components: alternativeDuty.components
        },
        savings: {
          amount: savingsAmount,
          percentage: savingsPercentage,
          avoidedTariffs
        }
      });
    }
  }

  // Sort by savings amount (highest first)
  return results.sort((a, b) => b.savings.amount - a.savings.amount);
}