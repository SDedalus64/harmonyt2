import { PORT_CONFIG } from '../config/port.config';

export interface PortDwellData {
  portCode: string;
  dwellDays: number;
  timestamp: string;
}

export class PortFeedService {
  private static instance: PortFeedService;
  private cache: Map<string, { data: PortDwellData; ts: number }> = new Map();

  private constructor() {}
  static getInstance(): PortFeedService {
    if (!PortFeedService.instance) {
      PortFeedService.instance = new PortFeedService();
    }
    return PortFeedService.instance;
  }

  private async fetchWithRetry(url: string, attempt = 0): Promise<Response> {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), PORT_CONFIG.requestTimeout);
      const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
      clearTimeout(t);
      if (!res.ok && res.status >= 500 && attempt < PORT_CONFIG.retry.maxAttempts - 1) {
        const backoff = PORT_CONFIG.retry.delayMs * Math.pow(PORT_CONFIG.retry.backoffMultiplier, attempt);
        await new Promise(r => setTimeout(r, backoff));
        return this.fetchWithRetry(url, attempt + 1);
      }
      return res;
    } catch (err) {
      if (attempt < PORT_CONFIG.retry.maxAttempts - 1) {
        const backoff = PORT_CONFIG.retry.delayMs * Math.pow(PORT_CONFIG.retry.backoffMultiplier, attempt);
        await new Promise(r => setTimeout(r, backoff));
        return this.fetchWithRetry(url, attempt + 1);
      }
      throw err;
    }
  }

  private isFresh(ts: number) {
    return Date.now() - ts < PORT_CONFIG.cacheDuration;
  }

  async getDwell(portCode: keyof typeof PORT_CONFIG.endpoints): Promise<PortDwellData> {
    const key = `dwell:${portCode}`;
    const cached = this.cache.get(key);
    if (cached && this.isFresh(cached.ts)) {
      return cached.data;
    }

    const url = PORT_CONFIG.endpoints[portCode];
    if (!url) {
      throw new Error(`Port endpoint for ${portCode} not configured`);
    }

    const res = await this.fetchWithRetry(url);
    if (!res.ok) {
      throw new Error(`Port feed fetch failed: ${res.status} ${res.statusText}`);
    }
    const json = await res.json();

    // Some port feeds return an array with the latest row at index 0
    const raw: any = Array.isArray(json) ? json[0] : json;

    const data: PortDwellData = {
      portCode,
      dwellDays: raw.dwell ?? raw.dwellDays ?? raw.avg_dwell_days ?? 0,
      timestamp: raw.timestamp ?? raw.report_date ?? raw.updated ?? new Date().toISOString()
    };
    this.cache.set(key, { data, ts: Date.now() });
    return data;
  }

  clearCache() {
    this.cache.clear();
  }
}

export const portFeedService = PortFeedService.getInstance();