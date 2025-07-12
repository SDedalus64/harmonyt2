export interface TariffRule {
  name: string;
  countries: string[] | "all";
  rate?: number; // Made optional for rules like section_301 that use lists
  effective?: string; // Made optional for rules like section_301 that use lists
  expires?: string | null;
  note?: string;
  legal_status?: string;
  rate_uk?: number;
  rate_energy_potash?: number;
  rate_potash?: number;
  chapters?: string[];
  lists?: Record<string, { rate: number; effective: string }>;
  exemptions?: {
    chapters?: string[];
    hts_prefixes?: string[];
    semiconductors?: string[];
    energy_chapters?: string[];
    potash_prefixes?: string[];
  };
  uk_codes?: string[];
  quota_countries?: string[];
  processing_strategy?: "preprocess" | "runtime"; // Added field
  hts_codes?: string[]; // Added for rules like section_201_solar that specify exact codes
}

export interface TariffRulesConfig {
  tariff_rules: Record<string, TariffRule>;
}

// Import the actual rules from the JSON file
import tariffRulesJson from "../../scripts/config/tariff_rules.json";

export const TARIFF_RULES: TariffRulesConfig =
  tariffRulesJson as TariffRulesConfig;
