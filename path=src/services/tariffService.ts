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

// Update the API URL to the new location
const TARIFF_API_URLS = [
  'https://cs410033fffad325ccb.blob.core.windows.net/$web/TCalc/tariffnew.json'
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

    try {
      const response = await fetch(TARIFF_API_URLS[this.currentUrlIndex], {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      // Handle response...
      this.lastFetchTime = Date.now();
      this.initialized = true;
      console.log('Successfully initialized tariff data from remote source');
    } catch (error) {
      console.error('Failed to initialize tariff data:', error);
      throw new Error('Failed to initialize tariff data');
    }
  }
}
