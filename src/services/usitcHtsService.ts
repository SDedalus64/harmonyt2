import { USITC_CONFIG, getUsitcUrls } from '../config/usitc.config';

interface UsitcClassificationResponse {
  htsno: string;
  description: string;
  uom: string | null;
  rates: Array<{
    column: string; // e.g., "general"
    rate: string;   // e.g., "3.4%"
  }>;
  footnotes?: string[];
  // The real API returns more, but we only need the essentials for now
}

export class UsitcHtsService {
  private static instance: UsitcHtsService;
  private cacheByCode: Map<string, UsitcClassificationResponse> = new Map();
  private chapterCache: any = null;
  private lastFetchTime = 0;
  private constructor() {}

  static getInstance(): UsitcHtsService {
    if (!UsitcHtsService.instance) {
      UsitcHtsService.instance = new UsitcHtsService();
    }
    return UsitcHtsService.instance;
  }

  /*  --------------------------------------------------------------------
   *  Generic fetch with timeout, retry, and exponential back-off
   *  ------------------------------------------------------------------*/
  private async fetchWithRetry(url: string, attempt = 0): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), USITC_CONFIG.requestTimeout);

      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'max-age=3600'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      // Retry on 5xx status codes
      if (!res.ok && res.status >= 500 && attempt < USITC_CONFIG.retry.maxAttempts - 1) {
        const backoff = USITC_CONFIG.retry.delayMs * Math.pow(USITC_CONFIG.retry.backoffMultiplier, attempt);
        await new Promise(r => setTimeout(r, backoff));
        return this.fetchWithRetry(url, attempt + 1);
      }

      return res;
    } catch (err) {
      if (attempt < USITC_CONFIG.retry.maxAttempts - 1) {
        const backoff = USITC_CONFIG.retry.delayMs * Math.pow(USITC_CONFIG.retry.backoffMultiplier, attempt);
        await new Promise(r => setTimeout(r, backoff));
        return this.fetchWithRetry(url, attempt + 1);
      }
      throw err;
    }
  }

  /*  --------------------------------------------------------------------
   *  Public helpers
   *  ------------------------------------------------------------------*/
  private isCacheFresh(): boolean {
    return Date.now() - this.lastFetchTime < USITC_CONFIG.cacheDuration;
  }

  async initialize(): Promise<void> {
    if (this.chapterCache && this.isCacheFresh()) {
      return;
    }

    const urls = getUsitcUrls();
    const res = await this.fetchWithRetry(urls.chapters);
    if (!res.ok) {
      throw new Error(`USITC chapters fetch failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    this.chapterCache = data;
    this.lastFetchTime = Date.now();
  }

  /** Fetch and cache a single HTS code classification record */
  async getClassification(code: string): Promise<UsitcClassificationResponse | null> {
    const normalized = code.replace(/[^0-9]/g, '').padStart(8, '0');
    if (this.cacheByCode.has(normalized) && this.isCacheFresh()) {
      return this.cacheByCode.get(normalized)!;
    }

    const urls = getUsitcUrls();
    const res = await this.fetchWithRetry(urls.getCode(normalized));
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`USITC classification fetch failed: ${res.status} ${res.statusText}`);
    }

    const payload: UsitcClassificationResponse = await res.json();
    this.cacheByCode.set(normalized, payload);
    return payload;
  }

  /** Clear all in-memory caches (helpful for tests) */
  clearCache() {
    this.cacheByCode.clear();
    this.chapterCache = null;
    this.lastFetchTime = 0;
  }
}

// Export singleton instance
