// Section 232 Quota Countries Configuration
// Countries that have tariff-rate quotas for steel and/or aluminum
// Note: UK quota arrangement expires March 12, 2025

export interface QuotaCountryInfo {
  code: string;
  name: string;
  hasSteel: boolean;
  hasAluminum: boolean;
  steelQuotaRate: number; // In-quota rate (usually 0%)
  steelOverRate: number; // Over-quota rate
  aluminumQuotaRate: number;
  aluminumOverRate: number;
}

export const SECTION_232_QUOTA_COUNTRIES: QuotaCountryInfo[] = [
  // Countries with both steel and aluminum quotas
  {
    code: "AR",
    name: "Argentina",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "BR",
    name: "Brazil",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "KR",
    name: "South Korea",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },

  // EU countries with quotas
  {
    code: "AT",
    name: "Austria",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "BE",
    name: "Belgium",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "BG",
    name: "Bulgaria",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "HR",
    name: "Croatia",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "CY",
    name: "Cyprus",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "CZ",
    name: "Czech Republic",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "DK",
    name: "Denmark",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "EE",
    name: "Estonia",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "FI",
    name: "Finland",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "FR",
    name: "France",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "DE",
    name: "Germany",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "GR",
    name: "Greece",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "HU",
    name: "Hungary",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "IE",
    name: "Ireland",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "IT",
    name: "Italy",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "LV",
    name: "Latvia",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "LT",
    name: "Lithuania",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "LU",
    name: "Luxembourg",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "MT",
    name: "Malta",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "NL",
    name: "Netherlands",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "PL",
    name: "Poland",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "PT",
    name: "Portugal",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "RO",
    name: "Romania",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "SK",
    name: "Slovakia",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "SI",
    name: "Slovenia",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "ES",
    name: "Spain",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },
  {
    code: "SE",
    name: "Sweden",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },

  // Use EU code for general EU imports (when specific country not identified)
  {
    code: "EU",
    name: "European Union",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 50,
    aluminumQuotaRate: 0,
    aluminumOverRate: 50,
  },

  // UK has temporary quota arrangement through March 31, 2025
  {
    code: "GB",
    name: "United Kingdom",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 25,
    aluminumQuotaRate: 0,
    aluminumOverRate: 25,
  },
  {
    code: "UK",
    name: "United Kingdom",
    hasSteel: true,
    hasAluminum: true,
    steelQuotaRate: 0,
    steelOverRate: 25,
    aluminumQuotaRate: 0,
    aluminumOverRate: 25,
  },
];

// Helper function to check if a country has Section 232 quotas
export function hasSection232Quota(countryCode: string): boolean {
  return SECTION_232_QUOTA_COUNTRIES.some((c) => c.code === countryCode);
}

// Helper function to get quota info for a country
export function getSection232QuotaInfo(
  countryCode: string,
): QuotaCountryInfo | undefined {
  return SECTION_232_QUOTA_COUNTRIES.find((c) => c.code === countryCode);
}

// Check if quota applies to specific HTS code
export function quotaAppliesForHTS(
  countryCode: string,
  htsCode: string,
): boolean {
  const quotaInfo = getSection232QuotaInfo(countryCode);
  if (!quotaInfo) return false;

  // Check if HTS is steel (chapters 72-73)
  const isSteel = htsCode.startsWith("72") || htsCode.startsWith("73");
  if (isSteel && quotaInfo.hasSteel) return true;

  // Check if HTS is aluminum (chapter 76)
  const isAluminum = htsCode.startsWith("76");
  if (isAluminum && quotaInfo.hasAluminum) return true;

  return false;
}
