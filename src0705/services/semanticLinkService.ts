import semanticLinksData from "../../data/semantic_links.json";
import materialAltLinksData from "../../data/material_alt_links.json";

interface SemanticLinksDB {
  [htsCode: string]: Array<{
    code: string;
    score: number;
    reason: string;
    reasonType: string;
  }>;
}

interface MaterialAltLinksDB {
  [htsCode: string]: Array<{
    code: string;
    score: number;
    reason?: string;
  }>;
}

const semanticLinks = semanticLinksData as SemanticLinksDB;
const materialAltLinks = materialAltLinksData as MaterialAltLinksDB;

export interface LinkSuggestion {
  code: string;
  score: number;
  reason?: string;
  reasonType?: "MATERIAL" | "PROCESS" | "ORIGIN" | "SEMANTIC";
}

export function getSemanticSuggestions(code: string): LinkSuggestion[] {
  const normalized = code.replace(/\D/g, "").slice(0, 8);

  const suggestions = semanticLinks[normalized] || [];

  return suggestions.map((s) => ({
    code: s.code,
    score: s.score,
    reason: s.reason,
    reasonType:
      (s.reasonType as "MATERIAL" | "PROCESS" | "ORIGIN" | "SEMANTIC") ||
      "SEMANTIC",
  }));
}

export function getMaterialSuggestions(code: string): LinkSuggestion[] {
  const normalized = code.replace(/\D/g, "").slice(0, 8);

  const alternatives = materialAltLinks[normalized] || [];

  return alternatives.map((alt) => ({
    code: alt.code,
    score: alt.score,
    reason: alt.reason || "Material alternative",
    reasonType: "MATERIAL" as const,
  }));
}

export function getAllTariffSuggestions(code: string): LinkSuggestion[] {
  const byCode: Record<string, LinkSuggestion> = {};
  getSemanticSuggestions(code).forEach((s) => {
    byCode[s.code] = {
      code: s.code,
      score: s.score,
      reason: s.reason,
      reasonType: s.reasonType,
    };
  });
  getMaterialSuggestions(code).forEach((s) => {
    if (byCode[s.code]) {
      byCode[s.code].score = Number(
        ((byCode[s.code].score + s.score) / 2).toFixed(3),
      );
    } else {
      byCode[s.code] = {
        code: s.code,
        score: s.score,
        reason: s.reason,
        reasonType: s.reasonType,
      };
    }
  });
  return Object.values(byCode).sort((a, b) => b.score - a.score);
}

export async function fetchAllTariffSuggestions(
  code: string,
): Promise<LinkSuggestion[]> {
  const normalized = code.replace(/\D/g, "");
  if (normalized.length < 6 || normalized.length > 10) {
    throw new Error("Please enter a valid 6–10 digit HTS code.");
  }
  try {
    return await new Promise<LinkSuggestion[]>((resolve) => {
      setTimeout(() => {
        resolve(getAllTariffSuggestions(code));
      }, 300);
    });
  } catch (err) {
    console.error("⚠️ Failed to generate suggestions:", err);
    return [];
  }
}
