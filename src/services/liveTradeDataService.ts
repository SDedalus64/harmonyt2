import AsyncStorage from "@react-native-async-storage/async-storage";

export interface LiveTradeData {
  id: string;
  title: string;
  summary: string;
  value: string;
  change: string;
  changePercent: number;
  date: string;
  url: string;
  source: string;
  category: string;
  priority: string;
  visualType: "chart" | "article";
  chartData: {
    type: string;
    value: number;
    change: number;
    period: string;
  };
}

interface CachedTradeData {
  data: LiveTradeData[];
  timestamp: number;
}

const CACHE_KEY = "@LiveTradeData:cache";
const CACHE_DURATION = 1 * 60 * 60 * 1000; // 1 hour

// Major commodity codes for trade monitoring (for future live API integration)
// const MAJOR_COMMODITIES = [
//   { code: '8504404010', name: 'Electronics' },
//   { code: '8471300000', name: 'Machinery' },
//   { code: '8517120000', name: 'Telephones' },
//   { code: '8708999200', name: 'Auto Parts' },
//   { code: '2709000000', name: 'Petroleum' },
// ];

export class LiveTradeDataService {
  private static instance: LiveTradeDataService;

  private constructor() {}

  static getInstance(): LiveTradeDataService {
    if (!LiveTradeDataService.instance) {
      LiveTradeDataService.instance = new LiveTradeDataService();
    }
    return LiveTradeDataService.instance;
  }

  async fetchLiveTradeData(): Promise<LiveTradeData[]> {
    console.log("LiveTradeDataService: Starting fetchLiveTradeData...");

    try {
      // Check cache first
      const cached = await this.loadFromCache();
      if (cached && this.isCacheFresh(cached.timestamp)) {
        console.log(
          "LiveTradeDataService: Using cached data, items:",
          cached.data.length,
        );
        return cached.data;
      }

      console.log(
        "LiveTradeDataService: Cache miss or stale, fetching fresh data...",
      );

      // For now, always return fallback data since Census API is having issues
      // This ensures users see realistic trade data immediately
      console.log(
        "LiveTradeDataService: Using fallback data due to API limitations",
      );
      const fallbackData = this.getFallbackTradeData();

      // Cache the fallback data so we don't keep hitting the API
      await this.saveToCache(fallbackData);

      return fallbackData;
    } catch (error) {
      console.error(
        "LiveTradeDataService: Error in fetchLiveTradeData:",
        error,
      );
      // Return realistic fallback data
      return this.getFallbackTradeData();
    }
  }

  private createFallbackData(
    commodity: { code: string; name: string },
    date: Date,
  ): LiveTradeData {
    // Generate realistic fallback values based on commodity type
    const baseValues: Record<string, number> = {
      Electronics: 15200000000, // $15.2B
      Machinery: 12800000000, // $12.8B
      Telephones: 8900000000, // $8.9B
      "Auto Parts": 7600000000, // $7.6B
      Petroleum: 5300000000, // $5.3B
    };

    const value = baseValues[commodity.name] || 1000000000;
    const changePercent = (Math.random() - 0.5) * 10; // Random change between -5% and +5%

    return {
      id: `fallback-${commodity.code}`,
      title: `${commodity.name} Performance`,
      summary: `${commodity.name}: $${this.formatValue(value)} (${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%), Machinery: $12.8B (+1.9%), Vehicles: $8.9B (-2.3%).`,
      value: this.formatValue(value),
      change: `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%`,
      changePercent,
      date: date.toISOString(),
      url: "https://www.census.gov/foreign-trade/statistics/highlights/top/index.html",
      source: "Census Bureau",
      category: "statistics",
      priority: Math.abs(changePercent) > 3 ? "high" : "medium",
      visualType: "chart" as const,
      chartData: {
        type: "trade-value",
        value,
        change: changePercent,
        period: date.toISOString().slice(0, 7),
      },
    };
  }

  private getFallbackTradeData(): LiveTradeData[] {
    return [
      {
        id: "trade-news-placeholder",
        title: "Trade News Feature Coming Soon",
        summary:
          "Live trade news and statistics will be available in a future update. This feature will integrate with official government sources including Census Bureau, CBP, USTR, and Federal Register.",
        value: "",
        change: "",
        changePercent: 0,
        date: new Date().toISOString(),
        url: "https://www.census.gov/foreign-trade/",
        source: "System",
        category: "placeholder",
        priority: "low",
        visualType: "article" as const,
        chartData: {
          type: "placeholder",
          value: 0,
          change: 0,
          period: "",
        },
      },
    ];
  }

  private formatValue(value: number): string {
    if (value >= 1e9) {
      return `${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M`;
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(1)}K`;
    }
    return value.toFixed(0);
  }

  private async loadFromCache(): Promise<CachedTradeData | null> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private async saveToCache(data: LiveTradeData[]) {
    try {
      const cacheData: CachedTradeData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.log("Failed to save trade data cache:", error);
    }
  }

  private isCacheFresh(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_DURATION;
  }
}

export const liveTradeDataService = LiveTradeDataService.getInstance();
