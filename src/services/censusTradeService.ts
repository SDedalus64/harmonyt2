import { CENSUS_CONFIG, getCensusUrls } from '../config/census.config';

export interface CensusTradeRow {
  CTY_CODE: string;        // Partner country code (ISO-numeric)
  E_COMMODITY: string;     // HS commodity code (HS10)
  GEN_VAL_YEP: string;     // Value in USD
  time: string;            // YYYY-MM
}

export class CensusTradeService {
  private static instance: CensusTradeService;
  private cache: Map<string, { data: CensusTradeRow[]; ts: number }> = new Map();
  private constructor() {}

  static getInstance(): CensusTradeService {
    if (!CensusTradeService.instance) {
      CensusTradeService.instance = new CensusTradeService();
    }
    return CensusTradeService.instance;
  }

  /* ------------------------------------------------------------------
   * Generic network helper
   * ----------------------------------------------------------------*/
  private async fetchWithRetry(url: string, attempt = 0): Promise<Response> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CENSUS_CONFIG.requestTimeout);

      const headers: Record<string, string> = { Accept: 'application/json' };
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok && res.status >= 500 && attempt < CENSUS_CONFIG.retry.maxAttempts - 1) {
        const backoff = CENSUS_CONFIG.retry.delayMs * Math.pow(CENSUS_CONFIG.retry.backoffMultiplier, attempt);
        await new Promise(r => setTimeout(r, backoff));
        return this.fetchWithRetry(url, attempt + 1);
      }
      return res;
    } catch (err) {
      if (attempt < CENSUS_CONFIG.retry.maxAttempts - 1) {
        const backoff = CENSUS_CONFIG.retry.delayMs * Math.pow(CENSUS_CONFIG.retry.backoffMultiplier, attempt);
        await new Promise(r => setTimeout(r, backoff));
        return this.fetchWithRetry(url, attempt + 1);
      }
      throw err;
    }
  }

  private buildUrl(hs10: string, yearMonth: string, type: 'imports' | 'exports'): string {
    const urls = getCensusUrls();
    const fn = type === 'imports' ? urls.monthlyImports : urls.monthlyExports;
    const url = fn(hs10, yearMonth);
    if (CENSUS_CONFIG.apiKey) {
      return `${url}&key=${CENSUS_CONFIG.apiKey}`;
    }
    return url;
  }

  private isFresh(ts: number) {
    return Date.now() - ts < CENSUS_CONFIG.cacheDuration;
  }

  private cacheKey(type: string, hs10: string, ym: string) {
    return `${type}:${hs10}:${ym}`;
  }

  /**
   * Fetch monthly import value for a specific HS10 code. Returns array of rows
   * (1 row per partner country).
   */
  async fetchMonthly(type: 'imports' | 'exports', hs10: string, yearMonth: string): Promise<CensusTradeRow[]> {
    const key = this.cacheKey(type, hs10, yearMonth);
    const cached = this.cache.get(key);
    if (cached && this.isFresh(cached.ts)) {
      return cached.data;
    }

    const url = this.buildUrl(hs10, yearMonth, type);
    const res = await this.fetchWithRetry(url);
    if (!res.ok) {
      throw new Error(`Census ${type} fetch failed: ${res.status} ${res.statusText}`);
    }

    // Census returns an array where first row is header
    const json: string[][] = await res.json();
    const [header, ...rows] = json;
    const colIndex: Record<string, number> = {};
    header.forEach((h, idx) => (colIndex[h] = idx));

    const mapped: CensusTradeRow[] = rows.map(r => ({
      CTY_CODE: r[colIndex['CTY_CODE']],
      E_COMMODITY: r[colIndex['E_COMMODITY']],
      GEN_VAL_YEP: r[colIndex['GEN_VAL_YEP']],
      time: r[colIndex['time']]
    }));

    this.cache.set(key, { data: mapped, ts: Date.now() });
    return mapped;
  }

  async fetchMonthlyImports(hs10: string, yearMonth: string) {
    return this.fetchMonthly('imports', hs10, yearMonth);
  }

  async fetchMonthlyExports(hs10: string, yearMonth: string) {
    return this.fetchMonthly('exports', hs10, yearMonth);
  }

  clearCache() {
    this.cache.clear();
  }
}

// Named singleton instance for convenience
export const censusTradeService = CensusTradeService.getInstance();