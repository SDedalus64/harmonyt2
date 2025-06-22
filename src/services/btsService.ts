import { BTS_CONFIG, getBtsUrls } from '../config/bts.config';

export interface BtsPortPerformance {
  portCode: string;
  dwellDays: number;
  lastUpdated: string;
}

export class BtsService {
  private static instance: BtsService;
  private cache: Map<string, { data: BtsPortPerformance; ts: number }> = new Map();

  private constructor() {}
  static getInstance(): BtsService {
    if (!BtsService.instance) {
      BtsService.instance = new BtsService();
    }
    return BtsService.instance;
  }

  private async fetchWithRetry(url: string, attempt = 0): Promise<Response> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), BTS_CONFIG.requestTimeout);
      const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok && res.status >= 500 && attempt < BTS_CONFIG.retry.maxAttempts - 1) {
        const backoff = BTS_CONFIG.retry.delayMs * Math.pow(BTS_CONFIG.retry.backoffMultiplier, attempt);
        await new Promise(r => setTimeout(r, backoff));
        return this.fetchWithRetry(url, attempt + 1);
      }
      return res;
    } catch (err) {
      if (attempt < BTS_CONFIG.retry.maxAttempts - 1) {
        const backoff = BTS_CONFIG.retry.delayMs * Math.pow(BTS_CONFIG.retry.backoffMultiplier, attempt);
        await new Promise(r => setTimeout(r, backoff));
        return this.fetchWithRetry(url, attempt + 1);
      }
      throw err;
    }
  }

  private isFresh(ts: number) {
    return Date.now() - ts < BTS_CONFIG.cacheDuration;
  }

  async getPortPerformance(portCode: string): Promise<BtsPortPerformance> {
    const key = `port:${portCode}`;
    const cached = this.cache.get(key);
    if (cached && this.isFresh(cached.ts)) {
      return cached.data;
    }

    const url = getBtsUrls().portPerformance(portCode);
    const res = await this.fetchWithRetry(url);
    if (!res.ok) {
      throw new Error(`BTS port performance fetch failed: ${res.status} ${res.statusText}`);
    }
    const payload = await res.json();
    // Normalize expected structure
    const data: BtsPortPerformance = {
      portCode,
      dwellDays: payload.dwellDays ?? payload.dwell ?? 0,
      lastUpdated: payload.lastUpdated ?? payload.updated ?? ''
    };
    this.cache.set(key, { data, ts: Date.now() });
    return data;
  }

  clearCache() {
    this.cache.clear();
  }
}

export const btsService = BtsService.getInstance();