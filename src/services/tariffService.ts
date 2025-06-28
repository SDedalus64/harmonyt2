// Types
// Pure Azure blob storage implementation - no local data

// Import Azure configuration
import { AZURE_CONFIG, getAzureUrls } from "../config/azure.config";

export interface TariffData {
  data_last_updated?: string;
  hts_revision?: string;
  tariffs: TariffEntry[];
  tariff_truce?: TariffTruce;
  metadata?: any;
  country_programs?: any;
}

export interface TariffEntry {
  // Core fields (always present)
  hts8: string;
  brief_description: string;

  // Quantity fields
  quantity_1_code?: string;
  quantity_2_code?: string;

  // WTO and MFN fields
  wto_binding_code?: string;
  mfn_text_rate?: string;
  mfn_rate_type_code?: string;
  mfn_ave?: number;
  mfn_ad_val_rate?: string | number;
  mfn_specific_rate?: string | number;
  mfn_other_rate?: string | number;

  // Special indicators
  pharmaceutical_ind?: string;
  dyes_indicator?: string;

  // Column 2 (penalty countries)
  col2_text_rate?: string;
  col2_rate_type_code?: string;
  col2_ad_val_rate?: string | number;
  col2_specific_rate?: string | number;
  col2_other_rate?: string | number;

  // Trade action fields (from preprocessing)
  has_special_trade_action?: boolean;
  trade_action_rate?: number;
  trade_action_countries?: string[];
  trade_action_label?: string;
  column2_countries?: string[];
  ntr_suspended_countries?: string[]; // Russia, Belarus

  // FTA/Special program fields (all optional - sparse data)
  // Each program can have: _indicator, _rate_type_code, _ad_val_rate, _specific_rate, _other_rate
  [key: string]: any; // Allow any FTA-specific fields

  // Special fields
  additional_duty?: string; // This likely contains Section 301 info
  additional_duty_rate?: number; // Parsed rate from additional_duty

  // Chapter 99 fields
  is_chapter_99?: boolean;
  is_special_provision?: boolean;
  chapter_99_additional_rate?: number;
  chapter_99_duty_text?: string;
  chapter_99_type?: string;

  // Additive duties (Section 232, Section 301, etc.)
  additive_duties?: Array<{
    type: string;
    name: string;
    rate: number;
    rate_uk?: number; // UK-specific rate for Section 232
    countries: string[] | "all";
    countries_reduced?: string[]; // Countries that get reduced rate
    label: string;
    uk_codes?: string[]; // UK-specific HTS codes
  }>;

  // Reciprocal tariff fields
  reciprocal_tariffs?: Array<{
    country: string;
    rate: number;
    label: string;
    note?: string;
    effective?: string;
    expires?: string;
  }>;

  // Available programs
  available_programs?: Array<{
    program_key: string;
    program_name: string;
    rate: number;
  }>;

  // Dates and notes
  begin_effect_date?: string;
  end_effective_date?: string;
  footnote_comment?: string;

  // IEEPA tariffs
  ieepa_tariffs?: Array<{
    country: string;
    rate: number;
    label: string;
    note?: string;
    legal_status?: string;
  }>;
}

export interface TariffTruce {
  active: boolean;
  start_date: string;
  end_date: string;
  implementation_time: string;
  applicability: string;
  affected_countries: {
    [key: string]: {
      target: string;
      old_tariff_rate: number;
      new_tariff_rate: number;
    };
  };
  htsus_reference: string;
  exclusions: Array<{
    product_category: string;
    note: string;
  }>;
  sources: string[];
}

// Constants
const MPF_RATE = 0.003464; // 0.3464% Merchandise Processing Fee
const MPF_MIN = 27.75;
const MPF_MAX = 538.4;
const HMF_RATE = 0.00125; // 0.125% Harbor Maintenance Fee

export class TariffService {
  private static instance: TariffService;
  private tariffData: TariffData | null = null;
  private segmentCache: Map<string, TariffEntry[]> = new Map();
  private initialized = false;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = AZURE_CONFIG.cacheDuration;

  private constructor() {}

  static getInstance(): TariffService {
    if (!TariffService.instance) {
      TariffService.instance = new TariffService();
    }
    return TariffService.instance;
  }

  // Add retry logic for network requests
  private async fetchWithRetry(url: string, retryCount = 0): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        AZURE_CONFIG.requestTimeout,
      );

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Cache-Control": "max-age=3600", // 1 hour cache
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok && retryCount < AZURE_CONFIG.retry.maxAttempts - 1) {
        const delay =
          AZURE_CONFIG.retry.delayMs *
          Math.pow(AZURE_CONFIG.retry.backoffMultiplier, retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, retryCount + 1);
      }

      return response;
    } catch (error) {
      if (retryCount < AZURE_CONFIG.retry.maxAttempts - 1) {
        const delay =
          AZURE_CONFIG.retry.delayMs *
          Math.pow(AZURE_CONFIG.retry.backoffMultiplier, retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, retryCount + 1);
      }
      throw error;
    }
  }

  isInitialized(): boolean {
    return (
      this.initialized && Date.now() - this.lastFetchTime < this.CACHE_DURATION
    );
  }

  async initialize(): Promise<void> {
    if (this.isInitialized()) {
      console.log("Tariff data already initialized and cached");
      return;
    }

    const startTime = Date.now();

    try {
      console.log(
        "🚀 Loading tariff data from Azure Blob Storage (no local fallback)...",
      );

      const urls = getAzureUrls();
      console.log("📡 Fetching from:", urls.mainData);

      // Fetch the main tariff data from Azure
      const response = await this.fetchWithRetry(urls.mainData);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch tariff data: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      // The data from Azure has the correct structure
      this.tariffData = data as TariffData;

      this.lastFetchTime = Date.now();
      this.initialized = true;

      const loadTime = Date.now() - startTime;
      console.log("✅ Successfully loaded tariff data from Azure");
      console.log(`⏱️  Load time: ${loadTime}ms`);
      console.log(
        "📊 Total tariff entries loaded:",
        this.tariffData?.tariffs?.length || 0,
      );
      console.log(
        "📅 Data last updated:",
        this.tariffData?.data_last_updated || "Unknown",
      );
      console.log(
        "📑 HTS Revision:",
        this.tariffData?.hts_revision || "Unknown",
      );

      // Log metadata if available
      if (this.tariffData?.metadata) {
        console.log("📋 Metadata:", this.tariffData.metadata);
      }
    } catch (error) {
      const loadTime = Date.now() - startTime;
      console.error(
        `❌ Failed to initialize tariff data after ${loadTime}ms:`,
        error,
      );

      // No local fallback - pure Azure implementation
      throw new Error(
        `Failed to load tariff data from Azure: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // New method to load segment data on demand
  async loadSegment(segmentId: string): Promise<TariffEntry[]> {
    // Check cache first
    if (this.segmentCache.has(segmentId)) {
      return this.segmentCache.get(segmentId)!;
    }

    try {
      const urls = getAzureUrls();
      const segmentUrl = urls.getSegmentUrl(segmentId);
      console.log(`Loading segment ${segmentId} from ${segmentUrl}`);

      const response = await this.fetchWithRetry(segmentUrl);

      if (!response.ok) {
        // Don't throw for 404s, just return empty array
        if (response.status === 404) {
          console.log(`Segment ${segmentId} not found, will use main data`);
          return [];
        }
        throw new Error(
          `Failed to fetch segment ${segmentId}: ${response.status}`,
        );
      }

      const segmentData = await response.json();

      // Cache the segment
      this.segmentCache.set(segmentId, segmentData);

      return segmentData;
    } catch (error) {
      console.error(`Failed to load segment ${segmentId}:`, error);
      return [];
    }
  }

  // Update findTariffEntry to use segments for better performance
  async findTariffEntryOptimized(
    htsCode: string,
  ): Promise<TariffEntry | undefined> {
    // For now, just use the main data since it contains all entries
    // Segment optimization can be added later when all segment files are available
    return this.findTariffEntry(htsCode);
  }

  private getSegmentId(prefix: string): string | null {
    const prefixNum = parseInt(prefix);

    // Based on the segment-index.json, these are the available segments:
    // Single digit segments: 1x, 3x, 4x, 5x
    // Individual chapters: 01-09, 20-29, 60-99

    // Check for x-segments first (10-19, 30-39, 40-49, 50-59)
    if (prefixNum >= 10 && prefixNum <= 19) return "1x";
    if (prefixNum >= 30 && prefixNum <= 39) return "3x";
    if (prefixNum >= 40 && prefixNum <= 49) return "4x";
    if (prefixNum >= 50 && prefixNum <= 59) return "5x";

    // Check for individual chapter files
    if (prefixNum >= 1 && prefixNum <= 9) return prefix.padStart(2, "0");
    if (prefixNum >= 20 && prefixNum <= 29) return prefix;
    if (prefixNum >= 60 && prefixNum <= 99) return prefix;

    // No segment file for chapters 10-19, 30-39, 40-49, 50-59 (except the x files)
    // and chapters 11-19, 31-39, 41-49, 51-59
    return null;
  }

  private normalizeHtsCode(code: string): string {
    // Don't normalize - just return the code as-is after removing any BOM character
    return String(code).replace(/\ufeff/g, "");
  }

  getLastUpdated(): string {
    return this.tariffData?.data_last_updated || "Unknown";
  }

  getHtsRevision(): string {
    return (
      this.tariffData?.hts_revision ||
      this.tariffData?.metadata?.hts_revision ||
      "Unknown"
    );
  }

  findTariffEntry(htsCode: string): TariffEntry | undefined {
    if (!this.tariffData?.tariffs) {
      console.log("No tariff data available");
      return undefined;
    }

    console.log("Searching for HTS code:", htsCode);
    console.log(
      "First 5 HTS codes in data:",
      this.tariffData.tariffs.slice(0, 5).map((e) => e.hts8),
    );

    const result = this.tariffData.tariffs.find(
      (entry) => entry.hts8 === htsCode,
    );

    if (!result) {
      console.log(
        "Code not found. Total entries:",
        this.tariffData.tariffs.length,
      );
    } else {
      console.log("Found entry with fields:", Object.keys(result));
      if (result.additional_duty) {
        console.log("Entry has additional_duty:", result.additional_duty);
      }
    }

    return result;
  }

  private parseDutyRate(rateStr: string): {
    percent: number;
    perUnit: number | null;
    unit: string | null;
    perUnitCurrency: string | null;
    isSpecialRate?: boolean;
    specialRateType?: string;
  } {
    if (!rateStr || rateStr.trim().toLowerCase() === "free") {
      return { percent: 0, perUnit: null, unit: null, perUnitCurrency: null };
    }

    let percent: number | null = null;
    let perUnit: number | null = null;
    let unit: string | null = null;
    let perUnitCurrency: string | null = null;
    let isSpecialRate = false;
    let specialRateType = "";

    // Check for special rate indicators in the rate string
    const specialRateIndicators = [
      { pattern: /GSP/i, type: "GSP" },
      { pattern: /USMCA/i, type: "USMCA" },
      { pattern: /FTA/i, type: "FTA" },
      { pattern: /Preferential/i, type: "Preferential" },
      { pattern: /Special/i, type: "Special" },
    ];

    for (const indicator of specialRateIndicators) {
      if (indicator.pattern.test(rateStr)) {
        isSpecialRate = true;
        specialRateType = indicator.type;
        break;
      }
    }

    // Match percentage rates
    const percentMatch = rateStr.match(/(\d+(?:\.\d+)?)%/);
    if (percentMatch) {
      percent = parseFloat(percentMatch[1]);
    }

    // Match per-unit rates
    const unitList = [
      "kg",
      "liter",
      "No.",
      "g",
      "lb",
      "cm",
      "m",
      "sqm",
      "doz",
      "pr",
      "pair",
      "l",
      "ml",
      "oz",
      "ton",
      "unit",
      "head",
      "each",
    ];
    const unitPattern = unitList.join("|");
    const perUnitRegex = new RegExp(
      "([$]?)([\\d.]+)(¢?)\\s*(?:/|\\s)?\\s*(" + unitPattern + ")",
      "ig",
    );
    const perUnitMatch = perUnitRegex.exec(rateStr);

    if (perUnitMatch) {
      perUnitCurrency = perUnitMatch[1]
        ? perUnitMatch[1]
        : perUnitMatch[3]
          ? "¢"
          : "";
      perUnit = parseFloat(perUnitMatch[2]);
      unit = perUnitMatch[4];
    }

    return {
      percent: percent || 0,
      perUnit,
      unit,
      perUnitCurrency,
      isSpecialRate,
      specialRateType,
    };
  }

  private calculateMPF(declaredValue: number): number {
    const mpfRaw = declaredValue * MPF_RATE;
    if (mpfRaw < MPF_MIN) return MPF_MIN;
    if (mpfRaw > MPF_MAX) return MPF_MAX;
    return mpfRaw;
  }

  private calculateHMF(declaredValue: number): number {
    return declaredValue * HMF_RATE;
  }

  private isTruceActive(): boolean {
    // Always return true for now to ensure truce rates are applied
    return true;
  }

  private formatDate(dateStr: string | undefined): string {
    if (!dateStr) return "";
    // Convert "7/1/20" to "7/1/2020"
    const parts = dateStr.split("/");
    if (parts.length === 3 && parts[2].length === 2) {
      const year = parseInt(parts[2]);
      // Assume 20xx for years 00-50, 19xx for years 51-99
      const fullYear = year <= 50 ? `20${parts[2]}` : `19${parts[2]}`;
      return `${parts[0]}/${parts[1]}/${fullYear}`;
    }
    return dateStr;
  }

  calculateDuty(
    htsCode: string,
    declaredValue: number,
    countryCode: string,
    isReciprocalAdditive: boolean = true, // Always treat reciprocal tariffs as additive
    excludeReciprocalTariff: boolean = false, // New parameter to control RT inclusion
    isUSMCAOrigin: boolean = false, // New parameter to specify USMCA origin
  ): {
    amount: number;
    dutyOnly: number;
    totalRate: number;
    components: Array<{
      type: string;
      rate: number;
      amount: number;
      label?: string;
    }>;
    breakdown: string[];
    fees: {
      mpf: { rate: number; amount: number };
      hmf: { rate: number; amount: number };
    };
    htsCode: string;
    description: string;
    effectiveDate: string;
    expirationDate: string;
  } | null {
    if (!this.tariffData?.tariffs) {
      throw new Error("Tariff data not initialized");
    }

    if (isNaN(declaredValue) || declaredValue <= 0) {
      return {
        amount: 0,
        dutyOnly: 0,
        totalRate: 0,
        components: [],
        breakdown: ["Invalid declared value"],
        fees: { mpf: { rate: 0, amount: 0 }, hmf: { rate: 0, amount: 0 } },
        htsCode: htsCode,
        description: "",
        effectiveDate: "",
        expirationDate: "",
      };
    }

    const countryCodeForTariffs = ["HK", "MO"].includes(countryCode)
      ? "CN"
      : countryCode;

    const entry = this.findTariffEntry(htsCode);
    if (!entry) {
      return {
        amount: 0,
        dutyOnly: 0,
        totalRate: 0,
        components: [],
        breakdown: ["No HTS code match found"],
        fees: { mpf: { rate: 0, amount: 0 }, hmf: { rate: 0, amount: 0 } },
        htsCode: htsCode,
        description: "",
        effectiveDate: "",
        expirationDate: "",
      };
    }

    // Handle Chapter 99 special provisions
    if (entry.is_chapter_99 && entry.chapter_99_additional_rate !== undefined) {
      // Check if this Chapter 99 provision applies to the given country
      let appliesToCountry = false;

      // Check the description or type to determine which countries this applies to
      const description = (entry.brief_description || "").toLowerCase();
      const htsCode = entry.hts8 || "";

      // Map Chapter 99 codes to their applicable countries
      if (htsCode === "99030110") {
        // This code is specifically for products FROM Canada
        appliesToCountry = countryCode === "CA";
      } else if (
        htsCode.startsWith("990301") &&
        description.includes("mexico")
      ) {
        // Mexico-specific provisions
        appliesToCountry = countryCode === "MX";
      } else if (
        htsCode.startsWith("990385") &&
        description.includes("aluminum")
      ) {
        // Aluminum provisions - check if it mentions specific countries
        if (description.includes("canada")) {
          appliesToCountry = countryCode === "CA";
        } else if (description.includes("mexico")) {
          appliesToCountry = countryCode === "MX";
        }
      }
      // Add more Chapter 99 country mappings as needed

      // Only apply if the country matches
      if (!appliesToCountry) {
        // This Chapter 99 provision doesn't apply to this country
        // Fall through to regular processing
      } else {
        // This is a Chapter 99 overlay provision that applies to this country
        const additionalRate = entry.chapter_99_additional_rate;
        const description = entry.brief_description || "";

        // For Chapter 99, we show the additional rate as the main rate
        const components: Array<{
          type: string;
          rate: number;
          amount: number;
          label?: string;
        }> = [
          {
            type: "Special Provision",
            rate: additionalRate,
            amount: (declaredValue * additionalRate) / 100,
            label: entry.chapter_99_type || "Chapter 99 Additional Duty",
          },
        ];

        const breakdown: string[] = [
          `${entry.chapter_99_type || "Special Provision"}: ${additionalRate}%`,
          entry.chapter_99_duty_text || `Additional duty of ${additionalRate}%`,
        ];

        // Calculate fees
        const dutyOnly = (declaredValue * additionalRate) / 100;
        let mpf = 0;
        let mpfExempt = false;

        // MPF is exempt for USMCA-qualified goods from Canada/Mexico
        if ((countryCode === "CA" || countryCode === "MX") && isUSMCAOrigin) {
          mpfExempt = true;
        } else {
          mpf = this.calculateMPF(declaredValue);
        }

        const hmf = this.calculateHMF(declaredValue);
        const totalAmount = dutyOnly + mpf + hmf;

        breakdown.push(`Base Duty Amount: $${dutyOnly.toFixed(2)}`);

        if (mpfExempt) {
          breakdown.push(
            `Merchandise Processing Fee: $0.00 (Exempt - USMCA origin)`,
          );
        } else {
          const mpfRateFormatted = Number(
            (MPF_RATE * 100).toFixed(4),
          ).toString();
          breakdown.push(
            `Merchandise Processing Fee (${mpfRateFormatted}%): $${mpf.toFixed(2)}`,
          );
        }

        breakdown.push(
          `Harbor Maintenance Fee (${(HMF_RATE * 100).toFixed(4)}%): $${hmf.toFixed(2)}`,
        );
        breakdown.push(`Total Duty & Fees: $${totalAmount.toFixed(2)}`);

        return {
          amount: totalAmount,
          dutyOnly,
          totalRate: additionalRate,
          components,
          breakdown,
          fees: {
            mpf: { rate: mpfExempt ? 0 : MPF_RATE * 100, amount: mpf },
            hmf: { rate: HMF_RATE * 100, amount: hmf },
          },
          htsCode: entry.hts8,
          description,
          effectiveDate: this.formatDate(entry.begin_effect_date),
          expirationDate: this.formatDate(entry.end_effective_date),
        };
      }
    }

    // Extract HTS code and description
    const actualHtsCode =
      entry.hts8 || entry["\ufeffhts8"] || entry["HTS Number"] || htsCode;
    const description = entry.brief_description || entry.Description || "";

    // Debug logging for Canadian products
    if (countryCode === "CA") {
      console.log("Canadian product entry:", {
        htsCode: actualHtsCode,
        additional_duty: entry.additional_duty,
        all_fields: Object.keys(entry).filter(
          (k) =>
            k.includes("canada") ||
            k.includes("usmca") ||
            k.includes("additional"),
        ),
      });
      // Add more detailed logging
      console.log("Full entry for debugging:", JSON.stringify(entry, null, 2));
      console.log("Looking for additional_duty field:", entry.additional_duty);
      console.log("Type of additional_duty:", typeof entry.additional_duty);
    }

    // Format dates
    const effectiveDate = this.formatDate(entry.begin_effect_date);
    const expirationDate = this.formatDate(entry.end_effective_date);

    const components: Array<{
      type: string;
      rate: number;
      amount: number;
      label?: string;
    }> = [];
    const breakdown: string[] = [];
    let totalRate = 0;
    let dutyOnly = 0;

    // Check if this entry has Column 2 rates and if they should apply to this country
    let baseRate = 0;
    let baseRateLabel = "";
    let usedSpecialRate = false;
    let specialRateType = "";

    // Check for special trade actions or Column 2 rates
    let shouldApplySpecialRate = false;
    let specialRateToApply = 0;
    let specialRateLabel = "";
    let specialDutyType = "";

    // First check if Russia/Belarus should use Column 2 rates (NTR suspended)
    if (
      entry.ntr_suspended_countries?.includes(countryCode) &&
      entry.col2_ad_val_rate
    ) {
      shouldApplySpecialRate = true;
      specialRateToApply = parseFloat(String(entry.col2_ad_val_rate)) * 100;
      specialRateLabel = "Column 2 Rate (NTR Suspended)";
      specialDutyType = "Column 2";
    }
    // Check if this entry has special trade action rates
    else if (
      entry.has_special_trade_action &&
      entry.trade_action_countries?.includes(countryCode)
    ) {
      shouldApplySpecialRate = true;
      specialRateToApply = entry.trade_action_rate || 0;
      specialRateLabel = entry.trade_action_label || "Trade Action Rate";
      specialDutyType = "Trade Action";
    }
    // Otherwise check for traditional Column 2 rates
    else if (
      entry.col2_ad_val_rate &&
      entry.column2_countries?.includes(countryCode)
    ) {
      shouldApplySpecialRate = true;
      specialRateToApply = parseFloat(String(entry.col2_ad_val_rate)) * 100;
      specialRateLabel = "Column 2 Rate";
      specialDutyType = "Column 2";
    }
    // Fallback to old logic for backwards compatibility
    else if (
      entry.col2_ad_val_rate &&
      (countryCode === "CU" || countryCode === "KP")
    ) {
      shouldApplySpecialRate = true;
      specialRateToApply = parseFloat(String(entry.col2_ad_val_rate)) * 100;
      specialRateLabel = "Column 2 Rate";
      specialDutyType = "Column 2";
    }

    if (shouldApplySpecialRate) {
      baseRate = specialRateToApply;
      baseRateLabel = `${specialRateLabel}: ${baseRate}%`;
      components.push({
        type: specialDutyType,
        rate: baseRate,
        amount: (declaredValue * baseRate) / 100,
        label: specialRateLabel,
      });
      totalRate += baseRate;
      breakdown.push(baseRateLabel);
    } else {
      // 1. Check for special FTA rates based on country
      let ftaRate: number | null = null;
      let ftaProgram = "";

      // Map country codes to FTA programs
      const countryToFTA: { [key: string]: string[] } = {
        CA: ["usmca", "nafta_canada"],
        MX: ["usmca", "nafta_mexico", "mexico"],
        KR: ["korea"],
        AU: ["australia"],
        CL: ["chile"],
        CO: ["colombia"],
        PA: ["panama"],
        PE: ["peru"],
        SG: ["singapore"],
        MA: ["morocco"],
        JO: ["jordan"],
        IL: ["israel_fta"],
        BH: ["bahrain"],
        OM: ["oman"],
        JP: ["japan"],
      };

      // Check if country has FTA
      const ftaPrograms = countryToFTA[countryCode] || [];
      for (const program of ftaPrograms) {
        const adValField = `${program}_ad_val_rate`;
        const indicatorField = `${program}_indicator`;

        // For USMCA, only use the rate if the goods are USMCA-origin
        if (
          (program === "usmca" ||
            program === "nafta_canada" ||
            program === "nafta_mexico") &&
          !isUSMCAOrigin
        ) {
          continue; // Skip USMCA rates if not USMCA origin
        }

        if (entry[indicatorField] && entry[adValField] !== undefined) {
          ftaRate = parseFloat(String(entry[adValField])) * 100; // Convert to percentage
          ftaProgram = program.toUpperCase().replace(/_/g, " ");
          // Make USMCA label clearer
          if (program === "usmca") {
            ftaProgram = "USMCA";
          } else if (program === "nafta_canada") {
            ftaProgram = "NAFTA Canada";
          } else if (program === "nafta_mexico") {
            ftaProgram = "NAFTA Mexico";
          }
          break;
        }
      }

      // Use FTA rate if available, otherwise MFN rate
      if (ftaRate !== null) {
        baseRate = ftaRate;
        baseRateLabel = `${ftaProgram} FTA Rate: ${baseRate}%`;
        usedSpecialRate = true;
        specialRateType = "FTA";
      } else {
        // Use MFN rate
        const mfnRate = entry.mfn_ad_val_rate
          ? parseFloat(String(entry.mfn_ad_val_rate)) * 100
          : 0;
        const mfnTextRate = entry.mfn_text_rate || `${mfnRate}%`;
        baseRate = mfnRate;
        baseRateLabel = `MFN Rate: ${mfnTextRate}`;
      }

      components.push({
        type: usedSpecialRate ? specialRateType : "MFN",
        rate: baseRate,
        amount: (declaredValue * baseRate) / 100,
        label: usedSpecialRate ? ftaProgram : "Most Favored Nation",
      });
      totalRate += baseRate;
      breakdown.push(baseRateLabel);
    }

    // 2. Check for additive duties (Section 232, Section 301, etc.)
    if (entry.additive_duties) {
      console.log("Found additive duties:", entry.additive_duties);
      for (const duty of entry.additive_duties) {
        // Check if this duty applies to the current country
        if (
          duty.countries === "all" ||
          (Array.isArray(duty.countries) &&
            duty.countries.includes(countryCodeForTariffs))
        ) {
          // Skip duties that will be handled in the reciprocal_tariffs array to avoid duplicates
          const dutyLabelLower = (duty.label || "").toLowerCase();
          const dutyRuleNameLower = (
            (duty as any).rule_name ||
            duty.name ||
            ""
          ).toLowerCase();

          // Skip duties that duplicate reciprocal_tariffs entries (Fentanyl or Reciprocal Tariff)
          if (
            // By explicit type (if defined)
            duty.type === "fentanyl" ||
            duty.type === "reciprocal_tariff" ||
            // By label text
            dutyLabelLower.includes("fentanyl") ||
            dutyLabelLower.includes("reciprocal tariff") ||
            // By rule_name text
            dutyRuleNameLower.includes("fentanyl") ||
            dutyRuleNameLower.includes("reciprocal tariff") ||
            dutyRuleNameLower.includes("ieepa")
          ) {
            continue; // duplicate – handled later in reciprocal_tariffs pass
          }

          console.log("Duty applies to country:", duty);

          // Always add all additive duties (Section 301, Section 232, etc.)
          if (duty.type === "section_301") {
            console.log("Adding Section 301:", duty);
            components.push({
              type: duty.type,
              rate: duty.rate,
              amount: (declaredValue * duty.rate) / 100,
              label: duty.label,
            });
            totalRate += duty.rate;
            breakdown.push(`${duty.label}: +${duty.rate}%`);
          } else if (duty.type === "section_232") {
            // Handle Section 232 with UK-specific rates
            let section232Rate = duty.rate;
            let section232Label = duty.label;

            // Check if UK gets reduced rate
            if (
              (countryCode === "GB" || countryCode === "UK") &&
              duty.rate_uk !== undefined
            ) {
              section232Rate = duty.rate_uk;
              section232Label = duty.label
                .replace("50%", "25%")
                .replace("UK 25%", "UK rate applied");
            }

            components.push({
              type: duty.type,
              rate: section232Rate,
              amount: (declaredValue * section232Rate) / 100,
              label: section232Label,
            });
            totalRate += section232Rate;
            breakdown.push(`${section232Label}: +${section232Rate}%`);
          } else {
            // For all other duties, always add them
            components.push({
              type: duty.type,
              rate: duty.rate,
              amount: (declaredValue * duty.rate) / 100,
              label: duty.label,
            });
            totalRate += duty.rate;
            breakdown.push(`${duty.label}: +${duty.rate}%`);
          }
        }
      }
    }

    // 3. Check for additional duties from the additional_duty field (legacy support)
    if (
      entry.additional_duty &&
      !entry.additive_duties?.some((d) => d.type === "section_301")
    ) {
      console.log("Found legacy additional duty:", entry.additional_duty);
      const rateMatch = entry.additional_duty.match(/(\d+(?:\.\d+)?)\s*%/);
      if (rateMatch) {
        const additionalRate = parseFloat(rateMatch[1]);
        let dutyLabel = "Additional Duty";
        let dutyType = "Additional Duty";

        // Customize label based on country and content
        if (
          countryCodeForTariffs === "CN" &&
          entry.additional_duty.toLowerCase().includes("301")
        ) {
          console.log("Found Section 301 in legacy field:", {
            additionalRate,
            countryCode,
          });

          // Always add Section 301
          dutyLabel = "Section 301";
          dutyType = "Section 301";

          components.push({
            type: dutyType,
            rate: additionalRate,
            amount: (declaredValue * additionalRate) / 100,
            label: dutyLabel,
          });
          totalRate += additionalRate;
          breakdown.push(`${dutyLabel}: +${additionalRate}%`);
        } else if (countryCode === "CA") {
          dutyLabel = "Canadian Lumber Tariff";
          dutyType = "Additional Duty";

          components.push({
            type: dutyType,
            rate: additionalRate,
            amount: (declaredValue * additionalRate) / 100,
            label: dutyLabel,
          });
          totalRate += additionalRate;
          breakdown.push(`${dutyLabel}: +${additionalRate}%`);
        }
      }
    }

    // 4. Apply reciprocal tariffs
    if (entry.reciprocal_tariffs && !excludeReciprocalTariff) {
      // Only apply RT if not excluded
      for (const reciprocalTariff of entry.reciprocal_tariffs) {
        if (reciprocalTariff.country === countryCodeForTariffs) {
          // Check if it's still active (only if expires date is provided)
          if (reciprocalTariff.expires) {
            const expiresDate = new Date(reciprocalTariff.expires);
            const now = new Date();
            if (now > expiresDate) {
              console.log(
                "Skipping expired reciprocal tariff:",
                reciprocalTariff,
              );
              continue; // Skip expired tariffs
            }
          }

          // Check for USMCA exemption for Canada/Mexico
          if (
            (countryCode === "CA" || countryCode === "MX") &&
            reciprocalTariff.note?.includes("USMCA-origin goods exempt") &&
            isUSMCAOrigin
          ) {
            console.log(
              "Skipping reciprocal tariff due to USMCA origin exemption:",
              {
                tariff: reciprocalTariff,
                isUSMCAOrigin,
              },
            );
            breakdown.push(`${reciprocalTariff.label}: Exempt (USMCA origin)`);
            continue; // Skip this reciprocal tariff
          }

          // Apply reciprocal tariffs
          console.log("Applying reciprocal tariff:", {
            tariff: reciprocalTariff,
            isUSMCAOrigin,
          });

          // Normalise tariff type so additive_duties and reciprocal/ieepa arrays share the same identifier
          let tariffType = "reciprocal_tariff";
          const labelLower = (reciprocalTariff.label || "").toLowerCase();
          if (labelLower.includes("fentanyl")) {
            tariffType = "fentanyl"; // matches additive_duties type
          } else if (labelLower.includes("ieepa")) {
            tariffType = "ieepa_tariff"; // matches additive_duties type
          }

          components.push({
            type: tariffType,
            rate: reciprocalTariff.rate,
            amount: (declaredValue * reciprocalTariff.rate) / 100,
            label: reciprocalTariff.label,
          });
          totalRate += reciprocalTariff.rate;
          breakdown.push(
            `${reciprocalTariff.label}: +${reciprocalTariff.rate}%`,
          );

          if (reciprocalTariff.note && !isUSMCAOrigin) {
            breakdown.push(`  (${reciprocalTariff.note})`);
          }
        }
      }
    }

    // 5. Apply IEEPA tariffs (Canada/Mexico)
    if (entry.ieepa_tariffs && !excludeReciprocalTariff) {
      // Use same exclusion flag for now
      for (const ieepaTariff of entry.ieepa_tariffs) {
        if (ieepaTariff.country === countryCodeForTariffs) {
          // Check for USMCA exemption
          if ((countryCode === "CA" || countryCode === "MX") && isUSMCAOrigin) {
            console.log(
              "Skipping IEEPA tariff due to USMCA origin exemption:",
              {
                tariff: ieepaTariff,
                isUSMCAOrigin,
              },
            );
            breakdown.push(`${ieepaTariff.label}: Exempt (USMCA origin)`);
            continue; // Skip this IEEPA tariff
          }

          // IEEPA tariffs do not stack with Section 232
          const hasSection232 = components.some(
            (c) => c.type === "section_232",
          );
          if (hasSection232) {
            console.log(
              "Skipping IEEPA tariff - does not stack with Section 232:",
              {
                tariff: ieepaTariff,
                hasSection232,
              },
            );
            breakdown.push(
              `${ieepaTariff.label}: Not applied (Section 232 takes precedence)`,
            );
            continue;
          }

          // Apply IEEPA tariff
          console.log("Applying IEEPA tariff:", {
            tariff: ieepaTariff,
            isUSMCAOrigin,
          });

          components.push({
            type: "ieepa_tariff",
            rate: ieepaTariff.rate,
            amount: (declaredValue * ieepaTariff.rate) / 100,
            label: ieepaTariff.label,
          });
          totalRate += ieepaTariff.rate;
          breakdown.push(`${ieepaTariff.label}: +${ieepaTariff.rate}%`);

          if (ieepaTariff.note) {
            breakdown.push(`  (${ieepaTariff.note})`);
          }
          if (ieepaTariff.legal_status) {
            breakdown.push(`  (${ieepaTariff.legal_status})`);
          }
        }
      }
    }

    // --- Deduplicate components to avoid double-counting (e.g., Fentanyl / Reciprocal repeats)
    const uniqueComponentsMap = new Map<string, (typeof components)[0]>();
    components.forEach((comp) => {
      // Use a compound key of label (if present) otherwise type, plus rate
      const key = `${comp.type.toLowerCase()}|${comp.rate}`;
      if (!uniqueComponentsMap.has(key)) {
        uniqueComponentsMap.set(key, comp);
      }
    });
    const dedupedComponents = Array.from(uniqueComponentsMap.values());

    // Recompute totalRate based on deduped list
    totalRate = dedupedComponents.reduce((sum, c) => sum + c.rate, 0);

    // Replace components with deduped list for further processing
    components.length = 0;
    components.push(...dedupedComponents);

    // 5. Calculate base duty amount
    dutyOnly = (declaredValue * totalRate) / 100;
    breakdown.push(`Base Duty Amount: $${dutyOnly.toFixed(2)}`);

    // 6. Add MPF (check for USMCA exemption)
    let mpf = 0;
    let mpfExempt = false;

    // MPF is exempt for USMCA-qualified goods from Canada/Mexico
    if ((countryCode === "CA" || countryCode === "MX") && isUSMCAOrigin) {
      mpfExempt = true;
      breakdown.push(
        `Merchandise Processing Fee: $0.00 (Exempt - USMCA origin)`,
      );
    } else {
      mpf = this.calculateMPF(declaredValue);
      const mpfRateFormatted = Number((MPF_RATE * 100).toFixed(4)).toString();
      breakdown.push(
        `Merchandise Processing Fee (${mpfRateFormatted}%): $${mpf.toFixed(2)}`,
      );
    }

    // 7. Add HMF (always applies, even for USMCA goods)
    const hmf = this.calculateHMF(declaredValue);
    const hmfRateFormatted = Number((HMF_RATE * 100).toFixed(4)).toString();
    breakdown.push(
      `Harbor Maintenance Fee (${hmfRateFormatted}%): $${hmf.toFixed(2)}`,
    );

    // 8. Calculate total
    const totalAmount = dutyOnly + mpf + hmf;
    breakdown.push(`Total Duty & Fees: $${totalAmount.toFixed(2)}`);

    // Deduplicate breakdown lines that list tariff components (avoid duplicates when same tariff came from multiple arrays)
    const dedupedBreakdown: string[] = [];
    const seenBreakKeys = new Set<string>();
    for (const line of breakdown) {
      let keyPart = line.split(":")[0].trim().toLowerCase();
      // Normalize by removing country suffixes like " - china (20%)" or parenthetical notes
      keyPart = keyPart.replace(/\s*-\s*[a-z ]+\(.*?\)/gi, "");
      keyPart = keyPart.replace(/\s*-\s*[a-z ]+$/gi, "");
      keyPart = keyPart.replace(/\s*\(.*?\)\s*$/g, "").trim();
      const isTariffLine =
        line.includes("+") &&
        line.includes("%") &&
        !line.toLowerCase().includes("exempt");
      if (isTariffLine) {
        if (!seenBreakKeys.has(keyPart)) {
          dedupedBreakdown.push(line);
          seenBreakKeys.add(keyPart);
        }
      } else {
        dedupedBreakdown.push(line);
      }
    }

    // Sort components in the specified order
    const sortComponents = (
      components: Array<{
        type: string;
        rate: number;
        amount: number;
        label?: string;
      }>,
    ): Array<{
      type: string;
      rate: number;
      amount: number;
      label?: string;
    }> => {
      const order = [
        "MFN", // Most Favored Nation (base HTS duty)
        "FTA", // Free Trade Agreement rate
        "Column 2", // Column 2 rate
        "Trade Action", // Trade Action rate
        "section_301", // Section 301
        "section_232", // Section 232
        "fentanyl", // Fentanyl tariffs
        "reciprocal_tariff", // Reciprocal Tariff
        "ieepa_tariff", // IEEPA Tariff (Canada/Mexico)
      ];

      return components.sort((a, b) => {
        const aIndex = order.indexOf(a.type);
        const bIndex = order.indexOf(b.type);

        // If type not found in order array, put it at the end
        const aOrder = aIndex === -1 ? order.length : aIndex;
        const bOrder = bIndex === -1 ? order.length : bIndex;

        return aOrder - bOrder;
      });
    };

    // Sort components before returning
    const sortedComponents = sortComponents(components);
    const finalBreakdown = dedupedBreakdown;

    return {
      amount: totalAmount,
      dutyOnly,
      totalRate,
      components: sortedComponents,
      breakdown: finalBreakdown,
      fees: {
        mpf: {
          rate: mpfExempt ? 0 : MPF_RATE * 100,
          amount: mpf,
        },
        hmf: {
          rate: HMF_RATE * 100,
          amount: hmf,
        },
      },
      htsCode: actualHtsCode,
      description,
      effectiveDate,
      expirationDate,
    };
  }

  // New method to calculate duty differences
  calculateDutyDifferences(
    htsCode: string,
    declaredValue: number,
    countryCode: string,
    isUSMCAOrigin: boolean = false,
  ): {
    toggleOff: {
      withRT: number;
      withoutRT: number;
      difference: number;
      percentDifference: number;
      appliedTariffs: string[];
      rtAmount: number;
      section301Amount: number;
    };
    toggleOn: {
      withRT: number;
      withoutRT: number;
      difference: number;
      percentDifference: number;
      appliedTariffs: string[];
      rtAmount: number;
      section301Amount: number;
    };
    analysis: {
      isSignificantDifference: boolean;
      toggleImpact: number;
      recommendation: string;
      rtImpact: {
        toggleOff: number;
        toggleOn: number;
      };
      section301Impact: {
        toggleOff: number;
        toggleOn: number;
      };
    };
    breakdown: string[];
  } | null {
    // Calculate duties for all scenarios
    const toggleOffWithRT = this.calculateDuty(
      htsCode,
      declaredValue,
      countryCode,
      false,
      false,
      isUSMCAOrigin,
    );
    const toggleOffWithoutRT = this.calculateDuty(
      htsCode,
      declaredValue,
      countryCode,
      false,
      true,
      isUSMCAOrigin,
    );
    const toggleOnWithRT = this.calculateDuty(
      htsCode,
      declaredValue,
      countryCode,
      true,
      false,
      isUSMCAOrigin,
    );
    const toggleOnWithoutRT = this.calculateDuty(
      htsCode,
      declaredValue,
      countryCode,
      true,
      true,
      isUSMCAOrigin,
    );

    if (
      !toggleOffWithRT ||
      !toggleOffWithoutRT ||
      !toggleOnWithRT ||
      !toggleOnWithoutRT
    ) {
      return null;
    }

    // Debug logging for diagnosis
    console.log("--- calculateDutyDifferences Debug ---");
    console.log("Input:", { htsCode, declaredValue, countryCode });
    console.log(
      "toggleOffWithRT:",
      toggleOffWithRT.amount,
      toggleOffWithRT.components,
    );
    console.log(
      "toggleOffWithoutRT:",
      toggleOffWithoutRT.amount,
      toggleOffWithoutRT.components,
    );
    console.log(
      "toggleOnWithRT:",
      toggleOnWithRT.amount,
      toggleOnWithRT.components,
    );
    console.log(
      "toggleOnWithoutRT:",
      toggleOnWithoutRT.amount,
      toggleOnWithoutRT.components,
    );

    // Extract RT and Section 301 amounts for each scenario
    const getTariffAmounts = (
      components: Array<{ type: string; amount: number }>,
    ) => {
      // Sum up all reciprocal-type tariffs (including fentanyl and IEEPA)
      const rtAmount = components
        .filter(
          (c) => c.type === "reciprocal_tariff" || c.type === "ieepa_tariff",
        )
        .reduce((sum, c) => sum + c.amount, 0);

      const section301Amount = components
        .filter((c) => c.type === "section_301")
        .reduce((sum, c) => sum + c.amount, 0);

      return { rtAmount, section301Amount };
    };

    const toggleOffWithRTAmounts = getTariffAmounts(toggleOffWithRT.components);
    const toggleOffWithoutRTAmounts = getTariffAmounts(
      toggleOffWithoutRT.components,
    );
    const toggleOnWithRTAmounts = getTariffAmounts(toggleOnWithRT.components);
    const toggleOnWithoutRTAmounts = getTariffAmounts(
      toggleOnWithoutRT.components,
    );

    // Calculate differences
    const toggleOffDiff = toggleOffWithRT.amount - toggleOffWithoutRT.amount;
    const toggleOnDiff = toggleOnWithRT.amount - toggleOnWithoutRT.amount;

    const toggleOffPercentDiff =
      toggleOffWithoutRT.amount > 0
        ? (toggleOffDiff / toggleOffWithoutRT.amount) * 100
        : 0;
    const toggleOnPercentDiff =
      toggleOnWithoutRT.amount > 0
        ? (toggleOnDiff / toggleOnWithoutRT.amount) * 100
        : 0;

    // More debug output
    console.log(
      "toggleOffDiff:",
      toggleOffDiff,
      "toggleOffPercentDiff:",
      toggleOffPercentDiff,
    );
    console.log(
      "toggleOnDiff:",
      toggleOnDiff,
      "toggleOnPercentDiff:",
      toggleOnPercentDiff,
    );
    console.log("RT amounts:", {
      toggleOffWithRT: toggleOffWithRTAmounts.rtAmount,
      toggleOnWithRT: toggleOnWithRTAmounts.rtAmount,
    });
    console.log("Section 301 amounts:", {
      toggleOffWithRT: toggleOffWithRTAmounts.section301Amount,
      toggleOnWithRT: toggleOnWithRTAmounts.section301Amount,
    });
    console.log("--------------------------------------");

    // Calculate RT and Section 301 impacts
    const rtImpact = {
      toggleOff: toggleOffWithRTAmounts.rtAmount,
      toggleOn: toggleOnWithRTAmounts.rtAmount,
    };

    const section301Impact = {
      toggleOff: toggleOffWithRTAmounts.section301Amount,
      toggleOn: toggleOnWithRTAmounts.section301Amount,
    };

    // Get applied tariffs for each scenario
    const getAppliedTariffs = (
      components: Array<{ type: string; label?: string }>,
    ) => components.map((c) => `${c.label || c.type} (${c.type})`);

    const toggleOffWithRTTariffs = getAppliedTariffs(
      toggleOffWithRT.components,
    );
    const toggleOffWithoutRTTariffs = getAppliedTariffs(
      toggleOffWithoutRT.components,
    );
    const toggleOnWithRTTariffs = getAppliedTariffs(toggleOnWithRT.components);
    const toggleOnWithoutRTTariffs = getAppliedTariffs(
      toggleOnWithoutRT.components,
    );

    // Analyze the differences
    const toggleImpact = toggleOnDiff - toggleOffDiff;
    const isSignificantDifference = Math.abs(toggleImpact) > 0.01; // More than 1 cent difference
    const recommendation = isSignificantDifference
      ? toggleImpact > 0
        ? "Consider using toggle OFF to minimize duties"
        : "Consider using toggle ON to minimize duties"
      : "Toggle state has minimal impact on duties";

    // Generate detailed breakdown
    const breakdown = [
      "Duty Comparison Analysis:",
      "----------------------------------------",
      "Toggle OFF:",
      `  With RT: $${toggleOffWithRT.amount.toFixed(2)}`,
      `    - RT Amount: $${toggleOffWithRTAmounts.rtAmount.toFixed(2)}`,
      `    - Section 301 Amount: $${toggleOffWithRTAmounts.section301Amount.toFixed(2)}`,
      `  Without RT: $${toggleOffWithoutRT.amount.toFixed(2)}`,
      `    - RT Amount: $${toggleOffWithoutRTAmounts.rtAmount.toFixed(2)}`,
      `    - Section 301 Amount: $${toggleOffWithoutRTAmounts.section301Amount.toFixed(2)}`,
      `  Difference: $${toggleOffDiff.toFixed(2)} (${toggleOffPercentDiff.toFixed(1)}%)`,
      `  Applied Tariffs: ${toggleOffWithRTTariffs.join(", ")}`,
      "",
      "Toggle ON:",
      `  With RT: $${toggleOnWithRT.amount.toFixed(2)}`,
      `    - RT Amount: $${toggleOnWithRTAmounts.rtAmount.toFixed(2)}`,
      `    - Section 301 Amount: $${toggleOnWithRTAmounts.section301Amount.toFixed(2)}`,
      `  Without RT: $${toggleOnWithoutRT.amount.toFixed(2)}`,
      `    - RT Amount: $${toggleOnWithoutRTAmounts.rtAmount.toFixed(2)}`,
      `    - Section 301 Amount: $${toggleOnWithoutRTAmounts.section301Amount.toFixed(2)}`,
      `  Difference: $${toggleOnDiff.toFixed(2)} (${toggleOnPercentDiff.toFixed(1)}%)`,
      `  Applied Tariffs: ${toggleOnWithRTTariffs.join(", ")}`,
      "",
      "Analysis:",
      `  Toggle Impact: $${toggleImpact.toFixed(2)}`,
      `  RT Impact:`,
      `    - Toggle OFF: $${rtImpact.toggleOff.toFixed(2)}`,
      `    - Toggle ON: $${rtImpact.toggleOn.toFixed(2)}`,
      `  Section 301 Impact:`,
      `    - Toggle OFF: $${section301Impact.toggleOff.toFixed(2)}`,
      `    - Toggle ON: $${section301Impact.toggleOn.toFixed(2)}`,
      `  Significant Difference: ${isSignificantDifference ? "Yes" : "No"}`,
      `  Recommendation: ${recommendation}`,
      "",
      "Detailed Component Breakdown:",
      "----------------------------------------",
      "Toggle OFF With RT:",
      ...toggleOffWithRT.breakdown,
      "",
      "Toggle OFF Without RT:",
      ...toggleOffWithoutRT.breakdown,
      "",
      "Toggle ON With RT:",
      ...toggleOnWithRT.breakdown,
      "",
      "Toggle ON Without RT:",
      ...toggleOnWithoutRT.breakdown,
    ];

    return {
      toggleOff: {
        withRT: toggleOffWithRT.amount,
        withoutRT: toggleOffWithoutRT.amount,
        difference: toggleOffDiff,
        percentDifference: toggleOffPercentDiff,
        appliedTariffs: toggleOffWithRTTariffs,
        rtAmount: toggleOffWithRTAmounts.rtAmount,
        section301Amount: toggleOffWithRTAmounts.section301Amount,
      },
      toggleOn: {
        withRT: toggleOnWithRT.amount,
        withoutRT: toggleOnWithoutRT.amount,
        difference: toggleOnDiff,
        percentDifference: toggleOnPercentDiff,
        appliedTariffs: toggleOnWithRTTariffs,
        rtAmount: toggleOnWithRTAmounts.rtAmount,
        section301Amount: toggleOnWithRTAmounts.section301Amount,
      },
      analysis: {
        isSignificantDifference,
        toggleImpact,
        recommendation,
        rtImpact,
        section301Impact,
      },
      breakdown,
    };
  }

  // Add search functionality for HTS code suggestions
  async searchByPrefix(
    prefix: string,
    limit: number = 15,
  ): Promise<Array<{ code: string; description: string }>> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.tariffData?.tariffs || prefix.length < 3) {
      return [];
    }

    const results: Array<{ code: string; description: string }> = [];

    // For performance, only search in the main data for now
    // In the future, this could be optimized to search segments
    for (const entry of this.tariffData.tariffs) {
      if (entry.hts8?.startsWith(prefix)) {
        results.push({
          code: entry.hts8,
          description: entry.brief_description || "",
        });

        if (results.length >= limit) {
          break;
        }
      }
    }

    return results;
  }
}
