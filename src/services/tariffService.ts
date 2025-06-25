// Types
// Pure Azure blob storage implementation - no local data

// Import Azure configuration
import { AZURE_CONFIG, getAzureUrls } from '../config/azure.config';
import { MPF_RATE, HMF_RATE } from '../constants/fees';
import { tariffCacheService } from './tariffCacheService';
import { tariffSearchService } from './tariffSearchService';

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
    rule_type?: string;
    name: string;
    rule_name?: string;
    rate: number;
    rate_uk?: number; // UK-specific rate for Section 232
    countries: string[] | 'all';
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
const MPF_MIN = 27.75;
const MPF_MAX = 538.40;

export class TariffService {
  private static instance: TariffService;
  private segmentCache: Map<string, TariffEntry[]> = new Map();

  private constructor() {}

  static getInstance(): TariffService {
    if (!TariffService.instance) {
      TariffService.instance = new TariffService();
    }
    return TariffService.instance;
  }

  private async loadSegment(segmentId: string): Promise<TariffEntry[]> {
    // Check in-memory cache first
    if (this.segmentCache.has(segmentId)) {
      return this.segmentCache.get(segmentId)!;
    }

    // Check local storage cache
    const segmentFile = `tariff-${segmentId}.json`;
    const cachedData = await tariffCacheService.getSegment(segmentFile);
    if (cachedData && cachedData.entries) {
      this.segmentCache.set(segmentId, cachedData.entries);
      console.log(`[TariffService] Loaded segment ${segmentId} from local cache.`);
      return cachedData.entries;
    }

    // Fetch from network if not cached
    console.log(`[TariffService] Segment ${segmentId} not cached. Fetching from network...`);
    const urls = getAzureUrls();
    const segmentUrl = urls.getSegmentUrl(segmentId);

    try {
      const response = await fetch(segmentUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch segment ${segmentId}: ${response.statusText}`);
      }
      const data = await response.json();
      const entries = data.entries || [];

      // Save to caches
      this.segmentCache.set(segmentId, entries);
      await tariffCacheService.setSegment(segmentFile, data);

      return entries;
    } catch (error) {
      console.error(`[TariffService] Error loading segment ${segmentId}:`, error);
      return []; // Return empty array on error
    }
  }

  private getSegmentId(htsCode: string): string | null {
    if (!htsCode || htsCode.length < 3) return null;
    return htsCode.substring(0, 3);
  }

  /**
   * Finds a tariff entry by first loading the correct segment
   * and then searching within that segment's data.
   */
  async findTariffEntry(htsCode: string): Promise<TariffEntry | undefined> {
    const normalizedCode = htsCode.replace(/\./g, '');
    const segmentId = this.getSegmentId(normalizedCode);

    if (!segmentId) {
      console.error('[TariffService] Could not determine segment ID for HTS code:', htsCode);
      return undefined;
    }

    const segmentData = await this.loadSegment(segmentId);
    if (!segmentData || segmentData.length === 0) {
      return undefined;
    }

    const entry = segmentData.find(e => (e.hts8 || '').replace(/\./g, '') === normalizedCode.replace(/\./g, ''));
    
    if (!entry) {
      console.log(`[TariffService] HTS code ${htsCode} (normalized: ${normalizedCode}) not found in segment ${segmentId}.`);
    }
    
    return entry;
  }

  private parseDutyRate(rateStr: string): {
    percent: number;
    perUnit: number | null;
    unit: string | null;
    perUnitCurrency: string | null;
    isSpecialRate?: boolean;
    specialRateType?: string;
  } {
    if (!rateStr || rateStr.trim().toLowerCase() === 'free') {
      return { percent: 0, perUnit: null, unit: null, perUnitCurrency: null };
    }

    let percent = null, perUnit = null, unit = null, perUnitCurrency = null;
    let isSpecialRate = false;
    let specialRateType = '';

    // Check for special rate indicators in the rate string
    const specialRateIndicators = [
      { pattern: /GSP/i, type: 'GSP' },
      { pattern: /USMCA/i, type: 'USMCA' },
      { pattern: /FTA/i, type: 'FTA' },
      { pattern: /Preferential/i, type: 'Preferential' },
      { pattern: /Special/i, type: 'Special' }
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
    const unitList = ['kg', 'liter', 'No.', 'g', 'lb', 'cm', 'm', 'sqm', 'doz', 'pr', 'pair', 'l', 'ml', 'oz', 'ton', 'unit', 'head', 'each'];
    const unitPattern = unitList.join('|');
    const perUnitRegex = new RegExp('([$]?)([\\d.]+)(¢?)\\s*(?:/|\\s)?\\s*(' + unitPattern + ')', 'ig');
    const perUnitMatch = perUnitRegex.exec(rateStr);

    if (perUnitMatch) {
      perUnitCurrency = perUnitMatch[1] ? perUnitMatch[1] : (perUnitMatch[3] ? '¢' : '');
      perUnit = parseFloat(perUnitMatch[2]);
      unit = perUnitMatch[4];
    }

    return {
      percent: percent || 0,
      perUnit,
      unit,
      perUnitCurrency,
      isSpecialRate,
      specialRateType
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
    if (!dateStr) return '';
    // Convert "7/1/20" to "7/1/2020"
    const parts = dateStr.split('/');
    if (parts.length === 3 && parts[2].length === 2) {
      const year = parseInt(parts[2]);
      // Assume 20xx for years 00-50, 19xx for years 51-99
      const fullYear = year <= 50 ? `20${parts[2]}` : `19${parts[2]}`;
      return `${parts[0]}/${parts[1]}/${fullYear}`;
    }
    return dateStr;
  }

  async calculateDuty(
    htsCode: string,
    declaredValue: number,
    countryCode: string,
    isReciprocalAdditive: boolean = true,  // Always treat reciprocal tariffs as additive
    excludeReciprocalTariff: boolean = false,  // New parameter to control RT inclusion
    isUSMCAOrigin: boolean = false  // New parameter to specify USMCA origin
  ): Promise<{
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
  } | null> {
    const entry = await this.findTariffEntry(htsCode);

    if (!entry) {
      console.error(`Could not find tariff data for HTS code: ${htsCode}`);
      return null; // Return null if no entry is found
    }

    if (isNaN(declaredValue) || declaredValue <= 0) {
      return {
        amount: 0,
        dutyOnly: 0,
        totalRate: 0,
        components: [],
        breakdown: ['Invalid declared value'],
        fees: { mpf: { rate: 0, amount: 0 }, hmf: { rate: 0, amount: 0 } },
        htsCode: htsCode,
        description: '',
        effectiveDate: '',
        expirationDate: ''
      };
    }

    const countryCodeForTariffs = ['HK', 'MO'].includes(countryCode) ? 'CN' : countryCode;

    // Handle Chapter 99 special provisions
    if (entry.is_chapter_99 && entry.chapter_99_additional_rate !== undefined) {
      // Check if this Chapter 99 provision applies to the given country
      let appliesToCountry = false;

      // Check the description or type to determine which countries this applies to
      const description = (entry.brief_description || '').toLowerCase();
      const htsCode = entry.hts8 || '';

      // Map Chapter 99 codes to their applicable countries
      if (htsCode === '99030110') {
        // This code is specifically for products FROM Canada
        appliesToCountry = countryCode === 'CA';
      } else if (htsCode.startsWith('990301') && description.includes('mexico')) {
        // Mexico-specific provisions
        appliesToCountry = countryCode === 'MX';
      } else if (htsCode.startsWith('990385') && description.includes('aluminum')) {
        // Aluminum provisions - check if it mentions specific countries
        if (description.includes('canada')) {
          appliesToCountry = countryCode === 'CA';
        } else if (description.includes('mexico')) {
          appliesToCountry = countryCode === 'MX';
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
        const description = entry.brief_description || '';

        // For Chapter 99, we show the additional rate as the main rate
        const components: Array<{
          type: string;
          rate: number;
          amount: number;
          label?: string;
        }> = [{
          type: "Special Provision",
          rate: additionalRate,
          amount: declaredValue * additionalRate / 100,
          label: entry.chapter_99_type || "Chapter 99 Additional Duty"
        }];

        const breakdown = [
          `${entry.chapter_99_type || 'Special Provision'}: ${additionalRate}%`,
          entry.chapter_99_duty_text || `Additional duty of ${additionalRate}%`
        ];

        // Calculate fees
        const dutyOnly = declaredValue * additionalRate / 100;
        let mpf = 0;
        let mpfExempt = false;

        // MPF is exempt for USMCA-qualified goods from Canada/Mexico
        if ((countryCode === 'CA' || countryCode === 'MX') && isUSMCAOrigin) {
          mpfExempt = true;
        } else {
          mpf = this.calculateMPF(declaredValue);
        }

        const hmf = this.calculateHMF(declaredValue);
        const totalAmount = dutyOnly + mpf + hmf;

        breakdown.push(`Base Duty Amount: $${dutyOnly.toFixed(2)}`);

        if (mpfExempt) {
          breakdown.push(`Merchandise Processing Fee: $0.00 (Exempt - USMCA origin)`);
        } else {
          const mpfRateFormatted = Number((MPF_RATE * 100).toFixed(4)).toString();
          breakdown.push(`Merchandise Processing Fee (${mpfRateFormatted}%): $${mpf.toFixed(2)}`);
        }

        breakdown.push(`Harbor Maintenance Fee (${(HMF_RATE * 100).toFixed(4)}%): $${hmf.toFixed(2)}`);
        breakdown.push(`Total Duty & Fees: $${totalAmount.toFixed(2)}`);

        return {
          amount: totalAmount,
          dutyOnly,
          totalRate: additionalRate,
          components,
          breakdown,
          fees: {
            mpf: { rate: mpfExempt ? 0 : MPF_RATE * 100, amount: mpf },
            hmf: { rate: HMF_RATE * 100, amount: hmf }
          },
          htsCode: entry.hts8,
          description,
          effectiveDate: this.formatDate(entry.begin_effect_date),
          expirationDate: this.formatDate(entry.end_effective_date)
        };
      }
    }

    // Extract HTS code and description
    const actualHtsCode = entry.hts8 || entry['\ufeffhts8'] || entry["HTS Number"] || htsCode;
    const description = entry.brief_description || entry["Description"] || '';

    // Debug logging for Canadian products
    if (countryCode === 'CA') {
      console.log('Canadian product entry:', {
        htsCode: actualHtsCode,
        additional_duty: entry.additional_duty,
        all_fields: Object.keys(entry).filter(k => k.includes('canada') || k.includes('usmca') || k.includes('additional'))
      });
      // Add more detailed logging
      console.log('Full entry for debugging:', JSON.stringify(entry, null, 2));
      console.log('Looking for additional_duty field:', entry.additional_duty);
      console.log('Type of additional_duty:', typeof entry.additional_duty);
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

    // Helper to add a component only if we haven't already added one with the
    // same label (guards against duplicates when a tariff appears in both
    // additive_duties and reciprocal_tariffs arrays).
    const pushUniqueComponent = (comp: { type: string; rate: number; amount: number; label?: string; }): boolean => {
      const isFentanyl = (str?: string) => str?.toLowerCase().includes('fentanyl');

      if (!components.some(c => {
        // Treat any two fentanyl-related lines as duplicates even if wording differs.
        if (isFentanyl(c.label) && isFentanyl(comp.label)) return true;
        return c.label === comp.label && c.type === comp.type;
      })) {
        components.push(comp);
        totalRate += comp.rate;
        return true;
      }
      console.log('[TariffService] Skipping duplicate component:', comp.label);
      return false;
    };

    const breakdown: string[] = [];
    let totalRate = 0;
    let dutyOnly = 0;

    // Check if this entry has Column 2 rates and if they should apply to this country
    let baseRate = 0;
    let baseRateLabel = '';
    let usedSpecialRate = false;
    let specialRateType = '';

    // Check for special trade actions or Column 2 rates
    let shouldApplySpecialRate = false;
    let specialRateToApply = 0;
    let specialRateLabel = '';
    let specialDutyType = '';

    // First check if Russia/Belarus should use Column 2 rates (NTR suspended)
    if (entry.ntr_suspended_countries?.includes(countryCode) && entry.col2_ad_val_rate) {
      shouldApplySpecialRate = true;
      specialRateToApply = parseFloat(String(entry.col2_ad_val_rate)) * 100;
      specialRateLabel = 'Column 2 Rate (NTR Suspended)';
      specialDutyType = 'Column 2';
    }
    // Check if this entry has special trade action rates
    else if (entry.has_special_trade_action && entry.trade_action_countries?.includes(countryCode)) {
      shouldApplySpecialRate = true;
      specialRateToApply = entry.trade_action_rate || 0;
      specialRateLabel = entry.trade_action_label || 'Trade Action Rate';
      specialDutyType = 'Trade Action';
    }
    // Otherwise check for traditional Column 2 rates
    else if (entry.col2_ad_val_rate && entry.column2_countries?.includes(countryCode)) {
      shouldApplySpecialRate = true;
      specialRateToApply = parseFloat(String(entry.col2_ad_val_rate)) * 100;
      specialRateLabel = 'Column 2 Rate';
      specialDutyType = 'Column 2';
    }
    // Fallback to old logic for backwards compatibility
    else if (entry.col2_ad_val_rate && (countryCode === 'CU' || countryCode === 'KP')) {
      shouldApplySpecialRate = true;
      specialRateToApply = parseFloat(String(entry.col2_ad_val_rate)) * 100;
      specialRateLabel = 'Column 2 Rate';
      specialDutyType = 'Column 2';
    }

    if (shouldApplySpecialRate) {
      baseRate = specialRateToApply;
      baseRateLabel = `${specialRateLabel}: ${baseRate}%`;
      pushUniqueComponent({
        type: specialDutyType,
        rate: baseRate,
        amount: declaredValue * baseRate / 100,
        label: specialRateLabel
      });
      breakdown.push(specialRateLabel);
    } else {
      // 1. Check for special FTA rates based on country
      let ftaRate: number | null = null;
      let ftaProgram = '';

      // Map country codes to FTA programs
      const countryToFTA: { [key: string]: string[] } = {
        'CA': ['usmca', 'nafta_canada'],
        'MX': ['usmca', 'nafta_mexico', 'mexico'],
        'KR': ['korea'],
        'AU': ['australia'],
        'CL': ['chile'],
        'CO': ['colombia'],
        'PA': ['panama'],
        'PE': ['peru'],
        'SG': ['singapore'],
        'MA': ['morocco'],
        'JO': ['jordan'],
        'IL': ['israel_fta'],
        'BH': ['bahrain'],
        'OM': ['oman'],
        'JP': ['japan']
      };

      // Check if country has FTA
      const ftaPrograms = countryToFTA[countryCode] || [];
      for (const program of ftaPrograms) {
        const adValField = `${program}_ad_val_rate`;
        const indicatorField = `${program}_indicator`;

        // For USMCA, only use the rate if the goods are USMCA-origin
        if ((program === 'usmca' || program === 'nafta_canada' || program === 'nafta_mexico') && !isUSMCAOrigin) {
          continue; // Skip USMCA rates if not USMCA origin
        }

        if (entry[indicatorField] && entry[adValField] !== undefined) {
          ftaRate = parseFloat(String(entry[adValField])) * 100; // Convert to percentage
          ftaProgram = program.toUpperCase().replace(/_/g, ' ');
          // Make USMCA label clearer
          if (program === 'usmca') {
            ftaProgram = 'USMCA';
          } else if (program === 'nafta_canada') {
            ftaProgram = 'NAFTA Canada';
          } else if (program === 'nafta_mexico') {
            ftaProgram = 'NAFTA Mexico';
          }
          break;
        }
      }

      // Use FTA rate if available, otherwise MFN rate
      if (ftaRate !== null) {
        baseRate = ftaRate;
        baseRateLabel = `${ftaProgram} FTA Rate: ${baseRate}%`;
        usedSpecialRate = true;
        specialRateType = 'FTA';
      } else {
        // Use MFN rate
        const mfnRate = entry.mfn_ad_val_rate ? parseFloat(String(entry.mfn_ad_val_rate)) * 100 : 0;
        const mfnTextRate = entry.mfn_text_rate || `${mfnRate}%`;
        baseRate = mfnRate;
        baseRateLabel = `MFN Rate: ${mfnTextRate}`;
      }

      pushUniqueComponent({
        type: usedSpecialRate ? specialRateType : "MFN",
        rate: baseRate,
        amount: declaredValue * baseRate / 100,
        label: usedSpecialRate ? ftaProgram : "Most Favored Nation"
      });
      breakdown.push(usedSpecialRate ? ftaProgram : "Most Favored Nation");
    }

    // 2. Check for additive duties (Section 232, Section 301, etc.)
    if (entry.additive_duties) {
      console.log('Found additive duties:', entry.additive_duties);
      for (const duty of entry.additive_duties) {
        // Check if this duty applies to the current country
        if (duty.countries === 'all' || (Array.isArray(duty.countries) && duty.countries.includes(countryCodeForTariffs))) {
          console.log('Duty applies to country:', duty);

          let dutyType = duty.rule_type || duty.type;
          const dutyLabel = duty.rule_name || duty.label || duty.name;

          // Ensure Fentanyl tariff gets the correct type for sorting
          if (dutyLabel?.toLowerCase().includes('fentanyl')) {
            dutyType = 'Fentanyl Anti-Trafficking Tariff';
          }

          // IEEPA Tariffs should only apply to Canada & Mexico.
          if (dutyLabel?.toLowerCase().includes('ieepa') && !['CA', 'MX'].includes(countryCodeForTariffs)) {
            console.log(`[TariffService] Skipping IEEPA tariff for non-CA/MX country: ${countryCodeForTariffs}`);
            continue; // Skip to the next duty
          }

          // Always add all additive duties (Section 301, Section 232, etc.)
          if (dutyType === 'section_301') {
            console.log('Adding Section 301:', duty);
            if (pushUniqueComponent({ type: dutyType, rate: duty.rate, amount: declaredValue * duty.rate / 100, label: dutyLabel })) {
              breakdown.push(dutyLabel);
            }
          } else if (dutyType === 'section_232') {
            // Handle Section 232 with UK-specific rates
            let section232Rate = duty.rate;
            let section232Label = dutyLabel;

            // Check if UK gets reduced rate
            if ((countryCode === 'GB' || countryCode === 'UK') && duty.rate_uk !== undefined) {
              section232Rate = duty.rate_uk;
              section232Label = dutyLabel.replace('50%', '25%').replace('UK 25%', 'UK rate applied');
            }

            if (pushUniqueComponent({ type: dutyType, rate: section232Rate, amount: declaredValue * section232Rate / 100, label: section232Label })) {
              breakdown.push(section232Label);
            }
          } else {
            // For all other duties, always add them
            if (pushUniqueComponent({ type: dutyType, rate: duty.rate, amount: declaredValue * duty.rate / 100, label: dutyLabel })) {
              breakdown.push(dutyLabel);
            }
          }
        }
      }
    }

    // 3. Check for additional duties from the additional_duty field (legacy support)
    if (entry.additional_duty && !entry.additive_duties?.some(d => d.type === 'section_301')) {
      console.log('Found legacy additional duty:', entry.additional_duty);
      const rateMatch = entry.additional_duty.match(/(\d+(?:\.\d+)?)\s*%/);
      if (rateMatch) {
        const additionalRate = parseFloat(rateMatch[1]);
        let dutyLabel = "Additional Duty";
        let dutyType = "Additional Duty";

        // Customize label based on country and content
        if (countryCodeForTariffs === 'CN' && entry.additional_duty.toLowerCase().includes('301')) {
          console.log('Found Section 301 in legacy field:', {
            additionalRate,
            countryCode
          });

          // Always add Section 301
          dutyLabel = "Section 301";
          dutyType = "Section 301";

          if (pushUniqueComponent({ type: dutyType, rate: additionalRate, amount: declaredValue * additionalRate / 100, label: dutyLabel })) {
            breakdown.push(dutyLabel);
          }
        } else if (countryCode === 'CA') {
          dutyLabel = "Canadian Lumber Tariff";
          dutyType = "Additional Duty";

          if (pushUniqueComponent({ type: dutyType, rate: additionalRate, amount: declaredValue * additionalRate / 100, label: dutyLabel })) {
            breakdown.push(dutyLabel);
          }
        }
      }
    }

    // 4. Apply reciprocal tariffs
    if (entry.reciprocal_tariffs && !excludeReciprocalTariff) {  // Only apply RT if not excluded
      for (const reciprocalTariff of entry.reciprocal_tariffs) {
        if (reciprocalTariff.country === countryCodeForTariffs) {
          // Check if it's still active (only if expires date is provided)
          if (reciprocalTariff.expires) {
            const expiresDate = new Date(reciprocalTariff.expires);
            const now = new Date();
            if (now > expiresDate) {
              console.log('Skipping expired reciprocal tariff:', reciprocalTariff);
              continue; // Skip expired tariffs
            }
          }

          // Check for USMCA exemption for Canada/Mexico
          if ((countryCode === 'CA' || countryCode === 'MX') &&
            reciprocalTariff.note?.includes('USMCA-origin goods exempt') &&
            isUSMCAOrigin) {
            console.log('Skipping reciprocal tariff due to USMCA origin exemption:', {
              tariff: reciprocalTariff,
              isUSMCAOrigin
            });
            breakdown.push(`${reciprocalTariff.label}: Exempt (USMCA origin)`);
            continue; // Skip this reciprocal tariff
          }

          // Apply reciprocal tariffs
          console.log('Applying reciprocal tariff:', {
            tariff: reciprocalTariff,
            isUSMCAOrigin
          });

          // Determine the type based on the label
          let tariffType = "Reciprocal Tariff";
          if (reciprocalTariff.label?.includes('Fentanyl')) {
            tariffType = "Fentanyl Anti-Trafficking Tariff";
          }

          const wasPushed = pushUniqueComponent({
            type: tariffType,
            rate: reciprocalTariff.rate,
            amount: declaredValue * reciprocalTariff.rate / 100,
            label: reciprocalTariff.label
          });

          if (wasPushed) {
            breakdown.push(reciprocalTariff.label);
          if (reciprocalTariff.note && !isUSMCAOrigin) {
            breakdown.push(`  (${reciprocalTariff.note})`);
          }
          }
        }
      }
    }

    // 5. Apply IEEPA tariffs (Canada/Mexico)
    if (entry.ieepa_tariffs && !excludeReciprocalTariff) {  // Use same exclusion flag for now
      for (const ieepaTariff of entry.ieepa_tariffs) {
        if (ieepaTariff.country === countryCodeForTariffs) {
          // Check for USMCA exemption
          if ((countryCode === 'CA' || countryCode === 'MX') && isUSMCAOrigin) {
            console.log('Skipping IEEPA tariff due to USMCA origin exemption:', {
              tariff: ieepaTariff,
              isUSMCAOrigin
            });
            breakdown.push(`${ieepaTariff.label}: Exempt (USMCA origin)`);
            continue; // Skip this IEEPA tariff
          }

          // IEEPA tariffs do not stack with Section 232
          const hasSection232 = components.some(c => c.type === 'section_232');
          if (hasSection232) {
            console.log('Skipping IEEPA tariff - does not stack with Section 232:', {
              tariff: ieepaTariff,
              hasSection232
            });
            breakdown.push(`${ieepaTariff.label}: Not applied (Section 232 takes precedence)`);
            continue;
          }

          // Apply IEEPA tariff
          console.log('Applying IEEPA tariff:', {
            tariff: ieepaTariff,
            isUSMCAOrigin
          });

          const wasPushed = pushUniqueComponent({
            type: "IEEPA Tariff",
            rate: ieepaTariff.rate,
            amount: declaredValue * ieepaTariff.rate / 100,
            label: ieepaTariff.label
          });

          if (wasPushed) {
            breakdown.push(ieepaTariff.label);
          if (ieepaTariff.note) {
            breakdown.push(`  (${ieepaTariff.note})`);
          }
          if (ieepaTariff.legal_status) {
            breakdown.push(`  (${ieepaTariff.legal_status})`);
          }
          }
        }
      }
    }

    // 5. Calculate base duty amount
    dutyOnly = declaredValue * totalRate / 100;
    breakdown.push(`Base Duty Amount: $${dutyOnly.toFixed(2)}`);

    // 6. Add MPF (check for USMCA exemption)
    let mpf = 0;
    let mpfExempt = false;

    // MPF is exempt for USMCA-qualified goods from Canada/Mexico
    if ((countryCode === 'CA' || countryCode === 'MX') && isUSMCAOrigin) {
      mpfExempt = true;
      breakdown.push(`Merchandise Processing Fee: $0.00 (Exempt - USMCA origin)`);
    } else {
      mpf = this.calculateMPF(declaredValue);
      const mpfRateFormatted = Number((MPF_RATE * 100).toFixed(4)).toString();
      breakdown.push(`Merchandise Processing Fee (${mpfRateFormatted}%): $${mpf.toFixed(2)}`);
    }

    // 7. Add HMF (always applies, even for USMCA goods)
    const hmf = this.calculateHMF(declaredValue);
    const hmfRateFormatted = Number((HMF_RATE * 100).toFixed(4)).toString();
    breakdown.push(`Harbor Maintenance Fee (${hmfRateFormatted}%): $${hmf.toFixed(2)}`);

    // 8. Calculate total
    const totalAmount = dutyOnly + mpf + hmf;
    breakdown.push(`Total Duty & Fees: $${totalAmount.toFixed(2)}`);

    // Sort components in the specified order
    const sortComponents = (components: Array<{
      type: string;
      rate: number;
      amount: number;
      label?: string;
    }>): Array<{
      type: string;
      rate: number;
      amount: number;
      label?: string;
    }> => {
      const order = [
        'MFN',  // Most Favored Nation (base HTS duty)
        'FTA',  // Free Trade Agreement rate
        'Column 2',  // Column 2 rate
        'Trade Action',  // Trade Action rate
        'section_301',  // Section 301
        'section_232',  // Section 232
        'Fentanyl Anti-Trafficking Tariff',  // Fentanyl tariffs
        'Reciprocal Tariff',  // Reciprocal Tariff
        'IEEPA Tariff',  // IEEPA Tariff (Canada/Mexico)
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

    return {
      amount: totalAmount,
      dutyOnly,
      totalRate,
      components: sortedComponents,
      breakdown,
      fees: {
        mpf: {
          rate: mpfExempt ? 0 : MPF_RATE * 100,
          amount: mpf
        },
        hmf: {
          rate: HMF_RATE * 100,
          amount: hmf
        }
      },
      htsCode: actualHtsCode,
      description,
      effectiveDate,
      expirationDate
    };
  }

  // New method to calculate duty differences
  async calculateDutyDifferences(
    htsCode: string,
    declaredValue: number,
    countryCode: string,
    isUSMCAOrigin: boolean = false
  ): Promise<{
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
  }> {
    // Calculate duties for all scenarios
    const [
      toggleOffWithRT,
      toggleOffWithoutRT,
      toggleOnWithRT,
      toggleOnWithoutRT,
    ] = await Promise.all([
      this.calculateDuty(htsCode, declaredValue, countryCode, false, false, isUSMCAOrigin),
      this.calculateDuty(htsCode, declaredValue, countryCode, false, true, isUSMCAOrigin),
      this.calculateDuty(htsCode, declaredValue, countryCode, true, false, isUSMCAOrigin),
      this.calculateDuty(htsCode, declaredValue, countryCode, true, true, isUSMCAOrigin),
    ]);

    // Handle cases where a calculation might fail
    if (!toggleOffWithRT || !toggleOffWithoutRT || !toggleOnWithRT || !toggleOnWithoutRT) {
      throw new Error(`Failed to calculate one or more duty scenarios for ${htsCode}`);
    }

    // Debug logging for diagnosis
    console.log('--- calculateDutyDifferences Debug ---');
    console.log('Input:', { htsCode, declaredValue, countryCode });
    console.log('toggleOffWithRT:', toggleOffWithRT.amount, toggleOffWithRT.components);
    console.log('toggleOffWithoutRT:', toggleOffWithoutRT.amount, toggleOffWithoutRT.components);
    console.log('toggleOnWithRT:', toggleOnWithRT.amount, toggleOnWithRT.components);
    console.log('toggleOnWithoutRT:', toggleOnWithoutRT.amount, toggleOnWithoutRT.components);

    // Extract RT and Section 301 amounts for each scenario
    const getTariffAmounts = (components: Array<{ type: string; amount: number }>) => {
      // Sum up all reciprocal-type tariffs (including fentanyl and IEEPA)
      const rtAmount = components
        .filter(c => c.type === 'Reciprocal Tariff' ||
                     c.type === 'Fentanyl Anti-Trafficking Tariff' ||
                     c.type === 'IEEPA Tariff')
        .reduce((sum, c) => sum + c.amount, 0);

      const section301Amount = components
        .filter(c => c.type === 'section_301')
        .reduce((sum, c) => sum + c.amount, 0);

      return { rtAmount, section301Amount };
    };

    const toggleOffWithRTAmounts = getTariffAmounts(toggleOffWithRT.components);
    const toggleOffWithoutRTAmounts = getTariffAmounts(toggleOffWithoutRT.components);
    const toggleOnWithRTAmounts = getTariffAmounts(toggleOnWithRT.components);
    const toggleOnWithoutRTAmounts = getTariffAmounts(toggleOnWithoutRT.components);

    // Calculate differences
    const toggleOffDiff = toggleOffWithRT.amount - toggleOffWithoutRT.amount;
    const toggleOnDiff = toggleOnWithRT.amount - toggleOnWithoutRT.amount;

    const toggleOffPercentDiff = toggleOffWithoutRT.amount > 0
      ? (toggleOffDiff / toggleOffWithoutRT.amount) * 100
      : 0;
    const toggleOnPercentDiff = toggleOnWithoutRT.amount > 0
      ? (toggleOnDiff / toggleOnWithoutRT.amount) * 100
      : 0;

    // More debug output
    console.log('toggleOffDiff:', toggleOffDiff, 'toggleOffPercentDiff:', toggleOffPercentDiff);
    console.log('toggleOnDiff:', toggleOnDiff, 'toggleOnPercentDiff:', toggleOnPercentDiff);
    console.log('RT amounts:', {
      toggleOffWithRT: toggleOffWithRTAmounts.rtAmount,
      toggleOnWithRT: toggleOnWithRTAmounts.rtAmount
    });
    console.log('Section 301 amounts:', {
      toggleOffWithRT: toggleOffWithRTAmounts.section301Amount,
      toggleOnWithRT: toggleOnWithRTAmounts.section301Amount
    });
    console.log('--------------------------------------');

    // Calculate RT and Section 301 impacts
    const rtImpact = {
      toggleOff: toggleOffWithRTAmounts.rtAmount,
      toggleOn: toggleOnWithRTAmounts.rtAmount
    };

    const section301Impact = {
      toggleOff: toggleOffWithRTAmounts.section301Amount,
      toggleOn: toggleOnWithRTAmounts.section301Amount
    };

    // Get applied tariffs for each scenario
    const getAppliedTariffs = (components: Array<{ type: string; label?: string }>) =>
      components.map(c => `${c.label || c.type} (${c.type})`);

    const toggleOffWithRTTariffs = getAppliedTariffs(toggleOffWithRT.components);
    const toggleOffWithoutRTTariffs = getAppliedTariffs(toggleOffWithoutRT.components);
    const toggleOnWithRTTariffs = getAppliedTariffs(toggleOnWithRT.components);
    const toggleOnWithoutRTTariffs = getAppliedTariffs(toggleOnWithoutRT.components);

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
      'Duty Comparison Analysis:',
      '----------------------------------------',
      'Toggle OFF:',
      `  With RT: $${toggleOffWithRT.amount.toFixed(2)}`,
      `    - RT Amount: $${toggleOffWithRTAmounts.rtAmount.toFixed(2)}`,
      `    - Section 301 Amount: $${toggleOffWithRTAmounts.section301Amount.toFixed(2)}`,
      `  Without RT: $${toggleOffWithoutRT.amount.toFixed(2)}`,
      `    - RT Amount: $${toggleOffWithoutRTAmounts.rtAmount.toFixed(2)}`,
      `    - Section 301 Amount: $${toggleOffWithoutRTAmounts.section301Amount.toFixed(2)}`,
      `  Difference: $${toggleOffDiff.toFixed(2)} (${toggleOffPercentDiff.toFixed(1)}%)`,
      `  Applied Tariffs: ${toggleOffWithRTTariffs.join(', ')}`,
      '',
      'Toggle ON:',
      `  With RT: $${toggleOnWithRT.amount.toFixed(2)}`,
      `    - RT Amount: $${toggleOnWithRTAmounts.rtAmount.toFixed(2)}`,
      `    - Section 301 Amount: $${toggleOnWithRTAmounts.section301Amount.toFixed(2)}`,
      `  Without RT: $${toggleOnWithoutRT.amount.toFixed(2)}`,
      `    - RT Amount: $${toggleOnWithoutRTAmounts.rtAmount.toFixed(2)}`,
      `    - Section 301 Amount: $${toggleOnWithoutRTAmounts.section301Amount.toFixed(2)}`,
      `  Difference: $${toggleOnDiff.toFixed(2)} (${toggleOnPercentDiff.toFixed(1)}%)`,
      `  Applied Tariffs: ${toggleOnWithRTTariffs.join(', ')}`,
      '',
      'Analysis:',
      `  Toggle Impact: $${toggleImpact.toFixed(2)}`,
      `  RT Impact:`,
      `    - Toggle OFF: $${rtImpact.toggleOff.toFixed(2)}`,
      `    - Toggle ON: $${rtImpact.toggleOn.toFixed(2)}`,
      `  Section 301 Impact:`,
      `    - Toggle OFF: $${section301Impact.toggleOff.toFixed(2)}`,
      `    - Toggle ON: $${section301Impact.toggleOn.toFixed(2)}`,
      `  Significant Difference: ${isSignificantDifference ? 'Yes' : 'No'}`,
      `  Recommendation: ${recommendation}`,
      '',
      'Detailed Component Breakdown:',
      '----------------------------------------',
      'Toggle OFF With RT:',
      ...toggleOffWithRT.breakdown,
      '',
      'Toggle OFF Without RT:',
      ...toggleOffWithoutRT.breakdown,
      '',
      'Toggle ON With RT:',
      ...toggleOnWithRT.breakdown,
      '',
      'Toggle ON Without RT:',
      ...toggleOnWithoutRT.breakdown
    ];

    return {
      toggleOff: {
        withRT: toggleOffWithRT.amount,
        withoutRT: toggleOffWithoutRT.amount,
        difference: toggleOffDiff,
        percentDifference: toggleOffPercentDiff,
        appliedTariffs: toggleOffWithRTTariffs,
        rtAmount: toggleOffWithRTAmounts.rtAmount,
        section301Amount: toggleOffWithRTAmounts.section301Amount
      },
      toggleOn: {
        withRT: toggleOnWithRT.amount,
        withoutRT: toggleOnWithoutRT.amount,
        difference: toggleOnDiff,
        percentDifference: toggleOnPercentDiff,
        appliedTariffs: toggleOnWithRTTariffs,
        rtAmount: toggleOnWithRTAmounts.rtAmount,
        section301Amount: toggleOnWithRTAmounts.section301Amount
      },
      analysis: {
        isSignificantDifference,
        toggleImpact,
        recommendation,
        rtImpact,
        section301Impact
      },
      breakdown
    };
  }

  // Add search functionality for HTS code suggestions
  async searchByPrefix(prefix: string, limit: number = 15): Promise<Array<{ code: string; description: string }>> {
    if (!this.segmentCache.size) {
      await this.loadSegment('1x'); // Load main data
    }

    if (!this.segmentCache.size || prefix.length < 3) {
      return [];
    }

    const results: Array<{ code: string; description: string }> = [];

    // For performance, only search in the main data for now
    // In the future, this could be optimized to search segments
    for (const entry of this.segmentCache.get('1x') || []) {
      if (entry.hts8?.startsWith(prefix)) {
        results.push({
          code: entry.hts8,
          description: entry.brief_description || ''
        });

        if (results.length >= limit) {
          break;
        }
      }
    }

    return results;
  }

  // --- Compatibility stub methods for legacy hooks/screens ---
  private _initialized = true; // segments load on demand, treat as initialized for API compatibility
  isInitialized(): boolean {
    return this._initialized;
  }

  async initialize(): Promise<void> {
    // No-op in new architecture; kept for backward compatibility
    this._initialized = true;
  }

  getLastUpdated(): string {
    return new Date().toISOString().split('T')[0];
  }

  getHtsRevision(): string {
    try {
      return tariffSearchService.getHtsRevision();
    } catch (e) {
      return 'N/A';
    }
  }

  /**
   * Legacy alias – optimized search now just calls standard search
   */
  async findTariffEntryOptimized(htsCode: string): Promise<TariffEntry | undefined> {
    return this.findTariffEntry(htsCode);
  }
}

export const tariffService = TariffService.getInstance();
