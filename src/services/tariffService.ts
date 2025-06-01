// Types
export interface TariffData {
  data_last_updated: string;
  tariffs: TariffEntry[];
  tariff_truce?: TariffTruce;
}

export interface TariffEntry {
  "HTS Number": string;
  "Description": string;
  "Unit of Quantity": string;
  "General Rate of Duty": string;
  "Special Rate of Duty": string;
  "Column 2 Rate of Duty": string;
  "301_List_1": string;
  "301_List_2": string;
  "301_List_3": string;
  "301_List_4A": string;
  "301_Duty_Rate": string | null;
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

// API endpoint - Azure Blob Storage URL
const TARIFF_API_URLS = [
  'https://cs410033fffad325ccb.blob.core.windows.net/$web/TCalc/Tariff.json'
] as string[];

export class TariffService {
  private static instance: TariffService;
  private tariffData: TariffData | null = null;
  private initialized = false;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache
  private currentUrlIndex = 0;

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

    let lastError: Error | null = null;

    // Try each URL until one works
    for (let i = 0; i < TARIFF_API_URLS.length; i++) {
      const url = TARIFF_API_URLS[i];
      this.currentUrlIndex = i;

    try {
        console.log('Attempting to fetch tariff data from:', url);
        console.log('Environment:', process.env.NODE_ENV);
        console.log('Custom API URL:', process.env.EXPO_PUBLIC_TARIFF_API_URL);
        console.log('Network status:', {
          online: navigator.onLine
        });

      const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.error('Request timeout after 10 seconds for URL:', url);
          controller.abort();
        }, 10000);

        try {
          const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
            console.error('HTTP error details:', {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              url: response.url
            });
        throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || !data.tariffs || !Array.isArray(data.tariffs)) {
        throw new Error('Invalid tariff data format received');
      }

      this.tariffData = data;
      this.lastFetchTime = Date.now();

      // Normalize HTS codes
      if (this.tariffData?.tariffs) {
        this.tariffData.tariffs = this.tariffData.tariffs.map(entry => ({
          ...entry,
          normalizedCode: this.normalizeHtsCode(entry["HTS Number"])
        }));
      }

      this.initialized = true;
          console.log('Successfully fetched tariff data from:', url);
          return;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.error('Fetch error details:', {
            url,
            error: {
              name: lastError.name,
              message: lastError.message,
              stack: lastError.stack
            },
            networkInfo: {
              online: navigator.onLine
            }
          });

          // If this wasn't the last URL, continue to the next one
          if (i < TARIFF_API_URLS.length - 1) {
            console.log('Trying next URL...');
            continue;
          }
        }
    } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error('Unexpected error:', {
          url,
          error: {
            name: lastError.name,
            message: lastError.message,
            stack: lastError.stack
          }
        });

        // If this wasn't the last URL, continue to the next one
        if (i < TARIFF_API_URLS.length - 1) {
          console.log('Trying next URL...');
          continue;
        }
      }
    }

    // If we get here, all URLs failed
    throw lastError || new Error('Failed to fetch tariff data from all available URLs');
  }

  private normalizeHtsCode(code: string): string {
    return String(code).replace(/\D/g, "").padEnd(10, '0');
  }

  getLastUpdated(): string {
    return this.tariffData?.data_last_updated || 'Unknown';
  }

  findTariffEntry(htsCode: string): TariffEntry | undefined {
    if (!this.tariffData?.tariffs) return undefined;

    const normalizedSearch = this.normalizeHtsCode(htsCode);
    return this.tariffData.tariffs.find(entry =>
      entry.normalizedCode === normalizedSearch
    );
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

  calculateDuty(
    htsCode: string,
    declaredValue: number,
    countryCode: string
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
        fees: { mpf: { rate: 0, amount: 0 }, hmf: { rate: 0, amount: 0 } }
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
        fees: { mpf: { rate: 0, amount: 0 }, hmf: { rate: 0, amount: 0 } }
      };
    }

    const components = [];
    const breakdown = [];
    let totalRate = 0;
    let dutyOnly = 0;

    // Check for Column 2 rates first (for Cuba and North Korea)
    const isColumn2Country = countryCode === 'CU' || countryCode === 'KP';
    let baseRate = 0;
    let baseRateLabel = '';
    let usedSpecialRate = false;
    let specialRateType = '';

    if (isColumn2Country) {
      const column2RateStr = entry["Column 2 Rate of Duty"] || "0%";
      const parsedColumn2Rate = this.parseDutyRate(column2RateStr);
      baseRate = parsedColumn2Rate.percent;
      baseRateLabel = `Column 2 Rate of Duty: ${baseRate}%`;
      components.push({
        type: "Column 2",
        rate: baseRate,
        amount: declaredValue * baseRate / 100,
        label: "Column 2 Rate"
      });
      totalRate += baseRate;
      breakdown.push(baseRateLabel);
    } else {
      // 1. Base rate: use Special Rate of Duty if eligible, else General Rate of Duty
      const specialRateStr = entry["Special Rate of Duty"] || '';
      let parsedSpecialRate = this.parseDutyRate(specialRateStr);
      let eligibleForSpecial = false;

      if (specialRateStr && specialRateStr.trim().toLowerCase() !== 'free') {
        // Example: "Free (A+,AU,BH,CL,CO,D,E,IL,JO,KR,MA,OM,P,PA,PE,S,SG)"
        const match = specialRateStr.match(/([\d.]+)%|Free/i);
        const countryCodesMatch = specialRateStr.match(/\(([^)]+)\)/);
        if (countryCodesMatch) {
          const codes = countryCodesMatch[1].split(',').map(c => c.trim());
          if (codes.includes(countryCode)) {
            eligibleForSpecial = true;
          }
        }
        if (eligibleForSpecial && match) {
          if (match[0].toLowerCase() === 'free') {
            parsedSpecialRate.percent = 0;
          } else {
            parsedSpecialRate.percent = parseFloat(match[1]);
          }
          baseRate = parsedSpecialRate.percent;
          baseRateLabel = `Special Rate of Duty: ${specialRateStr.split('(')[0].trim()}`;
          usedSpecialRate = true;
          specialRateType = 'FTA'; // This is typically an FTA rate
        }
      }

      if (!usedSpecialRate) {
        // Check General Rate for special rate indicators
        const generalRateStr = entry["General Rate of Duty"] || "0%";
        const parsedGeneralRate = this.parseDutyRate(generalRateStr);

        if (parsedGeneralRate.isSpecialRate) {
          baseRate = parsedGeneralRate.percent;
          baseRateLabel = `${parsedGeneralRate.specialRateType} Rate: ${baseRate}%`;
          usedSpecialRate = true;
          specialRateType = parsedGeneralRate.specialRateType || 'Special';
        } else {
          baseRate = parsedGeneralRate.percent;
          baseRateLabel = `General Rate of Duty: ${baseRate}%`;
        }
      }

      components.push({
        type: usedSpecialRate ? specialRateType : "MFN",
        rate: baseRate,
        amount: declaredValue * baseRate / 100,
        label: usedSpecialRate ? specialRateType : "Most Favored Nation"
      });
      totalRate += baseRate;
      breakdown.push(baseRateLabel);
    }

    // 2. Section 301 (China) and Truce Rate overlay
    let section301Rate = 0;
    let truceRate = 0;
    if (countryCode === 'CN') {
      // Section 301
      if (entry["301_Duty_Rate"]) {
        section301Rate = parseFloat(entry["301_Duty_Rate"].replace(/[^\d.]/g, "")) || 0;
        if (section301Rate > 0) {
          components.push({
            type: "Section 301",
            rate: section301Rate,
            amount: declaredValue * section301Rate / 100
          });
          totalRate += section301Rate;
          breakdown.push(`Section 301 Duty Rate: +${section301Rate}%`);
        }
      }
      // Truce Rate (hardcoded 30% like desktop version)
      if (this.isTruceActive()) {
        truceRate = 30; // Hardcoded 30% truce rate
        components.push({
          type: "Truce",
          rate: truceRate,
          amount: declaredValue * truceRate / 100
        });
        totalRate += truceRate;
        breakdown.push(`US-China Truce Rate: +${truceRate}%`);
      }
    }

    // 3. Calculate base duty amount
    dutyOnly = declaredValue * totalRate / 100;
    breakdown.push(`Base Duty Amount: $${dutyOnly.toFixed(2)}`);

    // 4. Add MPF
    const mpf = this.calculateMPF(declaredValue);
    const mpfRateFormatted = Number((MPF_RATE * 100).toFixed(4)).toString();
    breakdown.push(`MPF (${mpfRateFormatted}%): $${mpf.toFixed(2)}`);

    // 5. Add HMF
    const hmf = this.calculateHMF(declaredValue);
    const hmfRateFormatted = Number((HMF_RATE * 100).toFixed(4)).toString();
    breakdown.push(`HMF (${hmfRateFormatted}%): $${hmf.toFixed(2)}`);

    // 6. Calculate total
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
      }
    };
  }
}
