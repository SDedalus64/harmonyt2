// Types
import tariffDataJson from '../data/tariff_processed.json';

export interface TariffData {
  data_last_updated?: string;
  tariffs: TariffEntry[];
  tariff_truce?: TariffTruce;
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
    countries: string[] | 'all';
    label: string;
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

  // Computed field
  normalizedCode?: string;
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
const MPF_MAX = 538.40;
const HMF_RATE = 0.00125; // 0.125% Harbor Maintenance Fee

export class TariffService {
  private static instance: TariffService;
  private tariffData: TariffData | null = null;
  private initialized = false;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache

  private constructor() {}

  static getInstance(): TariffService {
    if (!TariffService.instance) {
      TariffService.instance = new TariffService();
    }
    return TariffService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized && Date.now() - this.lastFetchTime < this.CACHE_DURATION) {
      return;
    }

    try {
      // Use the imported preprocessed data directly
      const data = tariffDataJson;

      // The preprocessed data has the correct structure
          this.tariffData = data as TariffData;

        // Normalize HTS codes for all entries
        if (this.tariffData?.tariffs) {
          this.tariffData.tariffs = this.tariffData.tariffs.map(entry => ({
            ...entry,
            normalizedCode: this.normalizeHtsCode(entry.hts8 || entry['\ufeffhts8'] || entry["HTS Number"] || '')
          }));
        }

        this.lastFetchTime = Date.now();
        this.initialized = true;
      console.log('Successfully initialized tariff data from preprocessed file');
        console.log('Total tariff entries loaded:', this.tariffData?.tariffs?.length || 0);
      console.log('Data last updated:', this.tariffData?.data_last_updated || 'Unknown');

      // Log metadata if available
      if ((this.tariffData as any).metadata) {
        console.log('Metadata:', (this.tariffData as any).metadata);
      }
    } catch (error) {
      console.error('Failed to initialize tariff data:', error);
      throw new Error('Failed to initialize tariff data from preprocessed file');
    }
  }

  private normalizeHtsCode(code: string): string {
    // Remove BOM character if present and normalize to 8 digits
    const cleanedCode = String(code).replace(/\ufeff/g, '').replace(/\D/g, '');
    return cleanedCode.padEnd(8, '0').slice(0, 8);
  }

  getLastUpdated(): string {
    return this.tariffData?.data_last_updated || 'Unknown';
  }

  findTariffEntry(htsCode: string): TariffEntry | undefined {
    if (!this.tariffData?.tariffs) {
      console.log('No tariff data available');
      return undefined;
    }

    const normalizedSearch = this.normalizeHtsCode(htsCode);
    console.log('Searching for normalized code:', normalizedSearch);
    console.log('First 5 normalized codes in data:', this.tariffData.tariffs.slice(0, 5).map(e => e.normalizedCode));

    const result = this.tariffData.tariffs.find(entry =>
      entry.normalizedCode === normalizedSearch
    );

    if (!result) {
      console.log('Code not found. Total entries:', this.tariffData.tariffs.length);
    } else {
      console.log('Found entry with fields:', Object.keys(result));
      if (result.additional_duty) {
        console.log('Entry has additional_duty:', result.additional_duty);
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

  calculateDuty(
    htsCode: string,
    declaredValue: number,
    countryCode: string,
    isReciprocalAdditive: boolean = false,
    excludeReciprocalTariff: boolean = false  // New parameter to control RT inclusion
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
  } {
    if (!this.tariffData?.tariffs) {
      throw new Error('Tariff data not initialized');
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

    const entry = this.findTariffEntry(htsCode);
    if (!entry) {
      return {
        amount: 0,
        dutyOnly: 0,
        totalRate: 0,
        components: [],
        breakdown: ['No HTS code match found'],
        fees: { mpf: { rate: 0, amount: 0 }, hmf: { rate: 0, amount: 0 } },
        htsCode: htsCode,
        description: '',
        effectiveDate: '',
        expirationDate: ''
      };
    }

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
        const components = [{
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
        const mpf = this.calculateMPF(declaredValue);
        const hmf = this.calculateHMF(declaredValue);
        const totalAmount = dutyOnly + mpf + hmf;

        breakdown.push(`Base Duty Amount: $${dutyOnly.toFixed(2)}`);
        breakdown.push(`MPF (${(MPF_RATE * 100).toFixed(4)}%): $${mpf.toFixed(2)}`);
        breakdown.push(`HMF (${(HMF_RATE * 100).toFixed(4)}%): $${hmf.toFixed(2)}`);
        breakdown.push(`Total Duty & Fees: $${totalAmount.toFixed(2)}`);

        return {
          amount: totalAmount,
          dutyOnly,
          totalRate: additionalRate,
          components,
          breakdown,
          fees: {
            mpf: { rate: MPF_RATE * 100, amount: mpf },
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

    const components = [];
    const breakdown = [];
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
      components.push({
        type: specialDutyType,
        rate: baseRate,
        amount: declaredValue * baseRate / 100,
        label: specialRateLabel
      });
      totalRate += baseRate;
      breakdown.push(baseRateLabel);
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

        if (entry[indicatorField] && entry[adValField] !== undefined) {
          ftaRate = parseFloat(String(entry[adValField])) * 100; // Convert to percentage
          ftaProgram = program.toUpperCase().replace('_', ' ');
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

      components.push({
        type: usedSpecialRate ? specialRateType : "MFN",
        rate: baseRate,
        amount: declaredValue * baseRate / 100,
        label: usedSpecialRate ? ftaProgram : "Most Favored Nation"
      });
      totalRate += baseRate;
      breakdown.push(baseRateLabel);
    }

    // 2. Check for additive duties (Section 232, Section 301, etc.)
    if (entry.additive_duties) {
      console.log('Found additive duties:', entry.additive_duties);
      for (const duty of entry.additive_duties) {
        // Check if this duty applies to the current country
        if (duty.countries === 'all' || (Array.isArray(duty.countries) && duty.countries.includes(countryCode))) {
          console.log('Duty applies to country:', duty);

          // For Section 301, handle based on toggle and reciprocal tariff settings
          if (duty.type === 'section_301') {
            const hasReciprocalTariff = entry.reciprocal_tariffs?.some(rt => rt.country === countryCode);
            console.log('Section 301 decision:', {
              duty,
              isReciprocalAdditive,
              hasReciprocalTariff,
              shouldAdd: isReciprocalAdditive || !hasReciprocalTariff
            });

            // Add Section 301 if:
            // 1. Toggle is ON (isReciprocalAdditive is true), OR
            // 2. Toggle is OFF and there is no reciprocal tariff (RT takes precedence)
            if (isReciprocalAdditive || !hasReciprocalTariff) {
              components.push({
                type: duty.type,
                rate: duty.rate,
                amount: declaredValue * duty.rate / 100,
                label: duty.label
              });
              totalRate += duty.rate;
              breakdown.push(`${duty.label}: +${duty.rate}%`);
            }
          } else {
            // For all other duties (like Section 232), always add them
            components.push({
              type: duty.type,
              rate: duty.rate,
              amount: declaredValue * duty.rate / 100,
              label: duty.label
            });
            totalRate += duty.rate;
            breakdown.push(`${duty.label}: +${duty.rate}%`);
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
        if (countryCode === 'CN' && entry.additional_duty.toLowerCase().includes('301')) {
          console.log('Found Section 301 in legacy field:', {
            additionalRate,
            countryCode,
            hasReciprocalTariff: entry.reciprocal_tariffs?.some(rt => rt.country === countryCode),
            isReciprocalAdditive
          });

          // Use the same logic as above for legacy Section 301
          const hasReciprocalTariff = entry.reciprocal_tariffs?.some(rt => rt.country === countryCode);
          if (isReciprocalAdditive || !hasReciprocalTariff) {
            dutyLabel = "Section 301";
            dutyType = "Section 301";

            components.push({
              type: dutyType,
              rate: additionalRate,
              amount: declaredValue * additionalRate / 100,
              label: dutyLabel
            });
            totalRate += additionalRate;
            breakdown.push(`${dutyLabel}: +${additionalRate}%`);
          }
        } else if (countryCode === 'CA') {
          dutyLabel = "Canadian Lumber Tariff";
          dutyType = "Additional Duty";

          components.push({
            type: dutyType,
            rate: additionalRate,
            amount: declaredValue * additionalRate / 100,
            label: dutyLabel
          });
          totalRate += additionalRate;
          breakdown.push(`${dutyLabel}: +${additionalRate}%`);
        }
      }
    }

    // 4. Apply reciprocal tariffs
    if (entry.reciprocal_tariffs && !excludeReciprocalTariff) {  // Only apply RT if not excluded
      for (const reciprocalTariff of entry.reciprocal_tariffs) {
        if (reciprocalTariff.country === countryCode) {
          // Check if it's still active (if expires date is provided)
          if (reciprocalTariff.expires) {
            const expiresDate = new Date(reciprocalTariff.expires);
            const now = new Date();
            if (now > expiresDate) {
              console.log('Skipping expired reciprocal tariff:', reciprocalTariff);
              continue; // Skip expired tariffs
            }
          }

          // For reciprocal tariffs, add them if:
          // 1. Toggle is ON (isReciprocalAdditive is true), OR
          // 2. Toggle is OFF (RT takes precedence over Section 301)
          if (isReciprocalAdditive || true) {  // Always add RT when toggle is OFF
            console.log('Applying reciprocal tariff:', {
              tariff: reciprocalTariff,
              isReciprocalAdditive,
              hasSection301: components.some(c => c.type === 'section_301')
            });

            // Check for USMCA exemption for Canada/Mexico
            if ((countryCode === 'CA' || countryCode === 'MX') &&
                reciprocalTariff.note?.includes('USMCA-origin goods exempt')) {
              breakdown.push(`Note: ${reciprocalTariff.note}`);
            }

            components.push({
              type: "Reciprocal Tariff",
              rate: reciprocalTariff.rate,
              amount: declaredValue * reciprocalTariff.rate / 100,
              label: reciprocalTariff.label
            });
            totalRate += reciprocalTariff.rate;
            breakdown.push(`${reciprocalTariff.label}: +${reciprocalTariff.rate}%`);

            if (reciprocalTariff.note) {
              breakdown.push(`  (${reciprocalTariff.note})`);
            }
          }
        }
      }
    }

    // 5. Calculate base duty amount
    dutyOnly = declaredValue * totalRate / 100;
    breakdown.push(`Base Duty Amount: $${dutyOnly.toFixed(2)}`);

    // 6. Add MPF
    const mpf = this.calculateMPF(declaredValue);
    const mpfRateFormatted = Number((MPF_RATE * 100).toFixed(4)).toString();
    breakdown.push(`MPF (${mpfRateFormatted}%): $${mpf.toFixed(2)}`);

    // 7. Add HMF
    const hmf = this.calculateHMF(declaredValue);
    const hmfRateFormatted = Number((HMF_RATE * 100).toFixed(4)).toString();
    breakdown.push(`HMF (${hmfRateFormatted}%): $${hmf.toFixed(2)}`);

    // 8. Calculate total
    const totalAmount = dutyOnly + mpf + hmf;
    breakdown.push(`Total Duty & Fees: $${totalAmount.toFixed(2)}`);

    return {
      amount: totalAmount,
      dutyOnly,
      totalRate,
      components,
      breakdown,
      fees: {
        mpf: {
          rate: MPF_RATE * 100,
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
  calculateDutyDifferences(
    htsCode: string,
    declaredValue: number,
    countryCode: string
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
  } {
    // Calculate duties for all scenarios
    const toggleOffWithRT = this.calculateDuty(htsCode, declaredValue, countryCode, false, false);
    const toggleOffWithoutRT = this.calculateDuty(htsCode, declaredValue, countryCode, false, true);
    const toggleOnWithRT = this.calculateDuty(htsCode, declaredValue, countryCode, true, false);
    const toggleOnWithoutRT = this.calculateDuty(htsCode, declaredValue, countryCode, true, true);

    // Debug logging for diagnosis
    console.log('--- calculateDutyDifferences Debug ---');
    console.log('Input:', { htsCode, declaredValue, countryCode });
    console.log('toggleOffWithRT:', toggleOffWithRT.amount, toggleOffWithRT.components);
    console.log('toggleOffWithoutRT:', toggleOffWithoutRT.amount, toggleOffWithoutRT.components);
    console.log('toggleOnWithRT:', toggleOnWithRT.amount, toggleOnWithRT.components);
    console.log('toggleOnWithoutRT:', toggleOnWithoutRT.amount, toggleOnWithoutRT.components);

    // Extract RT and Section 301 amounts for each scenario
    const getTariffAmounts = (components: Array<{ type: string; amount: number }>) => ({
      rtAmount: components.find(c => c.type === 'Reciprocal Tariff')?.amount || 0,
      section301Amount: components.find(c => c.type === 'section_301')?.amount || 0
    });

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
}
