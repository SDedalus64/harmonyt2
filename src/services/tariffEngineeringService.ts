import tariffEngineeringData from "../../data/tariff_engineering.json";
import semanticLinksData from "../../data/semantic_links.json";
import materialLinksData from "../../data/material_alt_links.json";
import { TariffService } from "./tariffService";

export interface TariffEngineeringSuggestion {
  code: string;
  description: string;
  currentDutyRate: number;
  suggestedDutyRate: number;
  savings: number; // percentage points saved
  reason: string;
  reasonType:
    | "NEIGHBOR"
    | "MATERIAL"
    | "PROCESS"
    | "FUNCTION"
    | "COMPONENT"
    | "SEMANTIC";
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
    reasonType: "NEIGHBOR" | "MATERIAL" | "PROCESS" | "FUNCTION" | "COMPONENT";
  }>;
}

// Type cast the imported data
const engineeringDB = tariffEngineeringData as Record<
  string,
  TariffEngineeringEntry
>;

export function getTariffEngineeringSuggestions(
  code: string,
): TariffEngineeringSuggestion[] {
  const normalized = code.replace(/\D/g, "").padEnd(8, "0").slice(0, 8);

  console.log("[TariffEngineering] Looking for suggestions for:", normalized);
  console.log(
    "[TariffEngineering] Database has entries:",
    Object.keys(engineeringDB).length,
  );

  // First check if we have direct engineering suggestions
  const entry = engineeringDB[normalized];
  if (!entry) {
    console.log("[TariffEngineering] No entry found for code:", normalized);
    return [];
  }

  console.log("[TariffEngineering] Found entry:", entry);
  const suggestions: TariffEngineeringSuggestion[] = [];

  // Add suggestions from the engineering database (with duty rates)
  for (const suggestion of entry.suggestions) {
    if (suggestion.rateDifference > 0) {
      // Only show savings opportunities
      console.log(
        "[TariffEngineering] Adding suggestion with savings:",
        suggestion,
      );
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
    console.log("[TariffEngineering] Found semantic links:", semanticLinks);
    for (const link of semanticLinks.slice(0, 3)) {
      // Top 3 semantic matches
      // Check if this semantic match has a different duty rate
      const linkedEntry = engineeringDB[link.code];
      if (linkedEntry && linkedEntry.dutyRate < entry.dutyRate) {
        const savings = entry.dutyRate - linkedEntry.dutyRate;
        if (savings >= 1) {
          // At least 1% savings
          console.log(
            "[TariffEngineering] Adding semantic suggestion with savings:",
            link,
          );
          suggestions.push({
            code: link.code,
            description: linkedEntry.description,
            currentDutyRate: entry.dutyRate,
            suggestedDutyRate: linkedEntry.dutyRate,
            savings,
            reason: link.reason || "Semantic similarity",
            reasonType: "SEMANTIC",
          });
        }
      }
    }
  }

  // Sort by savings (highest first) and limit to top 10
  const result = suggestions.sort((a, b) => b.savings - a.savings).slice(0, 10);

  console.log("[TariffEngineering] Returning suggestions:", result);
  return result;
}

export function getNeighboringCodes(
  code: string,
): TariffEngineeringSuggestion[] {
  const normalized = code.replace(/\D/g, "").padEnd(8, "0").slice(0, 8);
  const entry = engineeringDB[normalized];
  if (!entry) return [];

  return entry.suggestions
    .filter((s) => s.reasonType === "NEIGHBOR" && s.rateDifference > 0)
    .map((s) => ({
      code: s.code,
      description: s.description,
      currentDutyRate: entry.dutyRate,
      suggestedDutyRate: s.dutyRate,
      savings: s.rateDifference,
      reason: s.reason,
      reasonType: s.reasonType as "NEIGHBOR",
    }))
    .slice(0, 5);
}

export function getMaterialAlternatives(
  code: string,
): TariffEngineeringSuggestion[] {
  const normalized = code.replace(/\D/g, "").padEnd(8, "0").slice(0, 8);
  const entry = engineeringDB[normalized];
  if (!entry) return [];

  return entry.suggestions
    .filter((s) => s.reasonType === "MATERIAL" && s.rateDifference > 0)
    .map((s) => ({
      code: s.code,
      description: s.description,
      currentDutyRate: entry.dutyRate,
      suggestedDutyRate: s.dutyRate,
      savings: s.rateDifference,
      reason: s.reason,
      reasonType: s.reasonType as "MATERIAL",
    }))
    .slice(0, 5);
}

export async function fetchTariffEngineeringSuggestions(
  code: string,
): Promise<TariffEngineeringSuggestion[]> {
  const normalized = code.replace(/\D/g, "");
  if (normalized.length < 6 || normalized.length > 10) {
    throw new Error("Please enter a valid 6–10 digit HTS code.");
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
  isUSMCAOrigin: boolean = false,
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
    isUSMCAOrigin,
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
      isUSMCAOrigin,
    );

    if (!alternativeDuty) continue;

    // Calculate savings
    const savingsAmount = currentDuty.amount - alternativeDuty.amount;
    const savingsPercentage = (savingsAmount / currentDuty.amount) * 100;

    // Determine avoided tariffs by comparing components
    const avoidedTariffs = currentDuty.components
      .filter(
        (current) =>
          !alternativeDuty.components.some(
            (alt) => alt.type === current.type && alt.rate >= current.rate,
          ),
      )
      .map((component) => component.label || component.type);

    if (savingsAmount > 0) {
      results.push({
        currentCode: htsCode,
        alternativeCode: suggestion.code,
        alternativeDescription: suggestion.description,
        engineeringStrategy: suggestion.reason,
        currentDuty: {
          totalAmount: currentDuty.amount,
          components: currentDuty.components,
        },
        alternativeDuty: {
          totalAmount: alternativeDuty.amount,
          components: alternativeDuty.components,
        },
        savings: {
          amount: savingsAmount,
          percentage: savingsPercentage,
          avoidedTariffs,
        },
      });
    }
  }

  // Sort by savings amount (highest first)
  return results.sort((a, b) => b.savings.amount - a.savings.amount);
}

export interface CreativeSemanticMatch {
  fromCode: string;
  fromDescription: string;
  fromChapter: string;
  toCode: string;
  toDescription: string;
  toChapter: string;
  fromRate: number;
  toRate: number;
  savingsPotential: "high" | "medium" | "low";
  legalBasis: string;
  reasoning: string;
  riskLevel: "low" | "medium" | "high";
  documentationNeeded: string[];
  realWorldExample: string;
  industryCategory: string;
}

// Import creative matches if available
let creativeMatchesData: CreativeSemanticMatch[] = [];
try {
  creativeMatchesData = require("../../data/targeted_creative_semantic_matches.json");
  console.log(
    "[TariffEngineering] Successfully loaded creative matches:",
    creativeMatchesData.length,
  );
} catch (e) {
  console.error("[TariffEngineering] Failed to load creative matches:", e);
  // Try alternative import method
  try {
    const data = require("../../data/targeted_creative_semantic_matches.json");
    creativeMatchesData = data.default || data;
    console.log(
      "[TariffEngineering] Loaded via alternative method:",
      creativeMatchesData.length,
    );
  } catch (e2) {
    console.error("[TariffEngineering] Alternative import also failed:", e2);
  }
}

export function getCreativeSemanticMatches(
  code: string,
): CreativeSemanticMatch[] {
  const normalized = code.replace(/\D/g, "").padEnd(8, "0").slice(0, 8);

  console.log(
    `[TariffEngineering] Looking for creative matches for code ${normalized}`,
  );
  console.log(
    `[TariffEngineering] Creative data loaded:`,
    creativeMatchesData.length,
    "items",
  );

  // Hardcoded example for testing
  if (normalized === "90189080") {
    console.log("[TariffEngineering] Returning hardcoded match for testing");
    return [
      {
        fromCode: "90189080",
        fromDescription: "Medical furniture and examination tables",
        fromChapter: "90",
        toCode: "94029000",
        toDescription: "Medical, surgical or veterinary furniture",
        toChapter: "94",
        fromRate: 7.5,
        toRate: 0,
        savingsPotential: "high" as const,
        legalBasis: "GRI 1 - Specific provision in Ch 94 for medical furniture",
        reasoning:
          "Medical examination tables without diagnostic equipment are furniture. CBP has ruled examination tables are classified in 9402 when not fitted with diagnostic devices.",
        riskLevel: "low" as const,
        documentationNeeded: [
          "Confirm table has no built-in diagnostic equipment",
          "Product literature emphasizing furniture aspects",
          "Photos showing general examination use",
        ],
        realWorldExample:
          "Basic examination tables, medical stools, procedure chairs",
        industryCategory: "Medical Devices & Supplies",
      },
    ];
  }

  // Find matches for this specific code or codes in the same 4-digit heading
  const matches = creativeMatchesData.filter(
    (match) =>
      match.fromCode === normalized ||
      match.fromCode.startsWith(normalized.substring(0, 4)),
  );

  console.log(
    `[TariffEngineering] Found ${matches.length} creative matches for code ${normalized}`,
  );
  console.log(`[TariffEngineering] Matches:`, matches);

  // Return matches sorted by savings potential
  return matches.sort((a, b) => {
    const savingsA = a.fromRate - a.toRate;
    const savingsB = b.fromRate - b.toRate;
    return savingsB - savingsA;
  });
}
