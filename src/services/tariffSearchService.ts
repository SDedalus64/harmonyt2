import { TariffEntry } from './tariffService';
import { AZURE_CONFIG, getAzureUrls } from '../config/azure.config';
import { tariffCacheService } from './tariffCacheService';

interface SegmentData {
  segment: string;
  description: string;
  count: number;
  entries: TariffEntry[];
}

// The tariff segmentation has evolved over time:
//   • original implementation: 1- and 2-digit buckets (singleDigitSegments / twoDigitSegments)
//   • current implementation (June 2025): 3-digit buckets stored under `segments`
// To remain backward-compatible we make all maps optional and the code dynamically
// adapts to whatever mapping is present in the Azure index.
interface SegmentIndex {
  // Newer 3-digit segmentation (e.g. "540" → "tariff-540.json")
  segments?: { [key: string]: string };

  // Legacy 1- and 2-digit segmentation (kept optional)
  singleDigitSegments?: { [key: string]: string };
  twoDigitSegments?: { [key: string]: string };

  metadata: {
    totalEntries: number;
    lastUpdated: string;
    segmentationDate: string;
    hts_revision: string;
  };
}

export class TariffSearchService {
  private static instance: TariffSearchService;
  private segmentIndex: SegmentIndex | null = null;
  private segmentCache: Map<string, SegmentData> = new Map();
  private initialized = false;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = AZURE_CONFIG.cacheDuration;

  private constructor() {}

  static getInstance(): TariffSearchService {
    if (!TariffSearchService.instance) {
      TariffSearchService.instance = new TariffSearchService();
    }
    return TariffSearchService.instance;
  }

  // Add retry logic for network requests (same as TariffService)
  private async fetchWithRetry(url: string, retryCount = 0): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AZURE_CONFIG.requestTimeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'max-age=3600' // 1 hour cache
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok && retryCount < AZURE_CONFIG.retry.maxAttempts - 1) {
        const delay = AZURE_CONFIG.retry.delayMs * Math.pow(AZURE_CONFIG.retry.backoffMultiplier, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, retryCount + 1);
      }

      return response;
    } catch (error) {
      if (retryCount < AZURE_CONFIG.retry.maxAttempts - 1) {
        const delay = AZURE_CONFIG.retry.delayMs * Math.pow(AZURE_CONFIG.retry.backoffMultiplier, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, retryCount + 1);
      }
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized && Date.now() - this.lastFetchTime < this.CACHE_DURATION;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized()) {
      console.log('TariffSearchService already initialized and cached');
      return;
    }

    try {
      console.log('🔍 Initializing TariffSearchService with Azure segment index...');
      const urls = getAzureUrls();

      // Fetch the segment index
      const response = await this.fetchWithRetry(urls.segmentIndex);

      if (!response.ok) {
        throw new Error(`Failed to fetch segment index: ${response.status} ${response.statusText}`);
      }

      this.segmentIndex = await response.json();
      this.lastFetchTime = Date.now();
      this.initialized = true;

      console.log('✅ TariffSearchService initialized with segment index from Azure');
      console.log('📊 Available segments:', {
        threeDigit: `${Object.keys(this.segmentIndex?.segments || {}).length} segments`,
        singleDigit: `${Object.keys(this.segmentIndex?.singleDigitSegments || {}).length} segments`,
        twoDigit: `${Object.keys(this.segmentIndex?.twoDigitSegments || {}).length} segments`,
      });
    } catch (error) {
      console.error('❌ Failed to initialize TariffSearchService:', error);
      throw error;
    }
  }

  private async loadSegmentData(segmentFile: string): Promise<SegmentData | null> {
    // Check local storage cache first
    const cachedData = await tariffCacheService.getSegment(segmentFile);
    if (cachedData) {
      // Also update in-memory cache for this session
      this.segmentCache.set(segmentFile, cachedData);
      return cachedData;
    }

    // Check in-memory cache (for this session)
    if (this.segmentCache.has(segmentFile)) {
      return this.segmentCache.get(segmentFile)!;
    }

    try {
      const urls = getAzureUrls();
      // Extract segment ID from filename (e.g., "tariff-01.json" -> "01")
      const segmentId = segmentFile.replace('tariff-', '').replace('.json', '');
      const segmentUrl = urls.getSegmentUrl(segmentId);

      console.log(`📥 Loading segment ${segmentFile} from Azure...`);

      const response = await this.fetchWithRetry(segmentUrl);

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Segment ${segmentFile} not found`);
          return null;
        }
        throw new Error(`Failed to fetch segment ${segmentFile}: ${response.status}`);
      }

      const segmentData = await response.json();

      // Cache the segment in memory AND in local storage
      this.segmentCache.set(segmentFile, segmentData);
      await tariffCacheService.setSegment(segmentFile, segmentData);

      console.log(`✅ Loaded segment ${segmentFile} with ${segmentData.entries?.length || 0} entries`);

      return segmentData;
    } catch (error) {
      console.error(`Failed to load segment ${segmentFile}:`, error);
      return null;
    }
  }

  /**
   * Returns the single most specific segment file that exactly matches the
   * given prefix (3-, 2-, or 1-digit) or `null` if no direct match exists.
   *
   * IMPORTANT: This helper only returns a single file.  Call sites that need
   * to load *all* segments matching a short prefix should iterate over the
   * maps directly (see logic further below).
   */
  private getSegmentFileForPrefix(prefix: string): string | null {
    if (!this.segmentIndex) return null;

    // 3-digit lookup (new format)
    if (this.segmentIndex.segments && prefix.length >= 3) {
      const threeDigitKey = prefix.substring(0, 3);
      const file = this.segmentIndex.segments[threeDigitKey];
      if (file) return file;
    }

    // 2-digit lookup (legacy format)
    if (this.segmentIndex.twoDigitSegments && prefix.length >= 2) {
      const twoDigitKey = prefix.substring(0, 2);
      const file = this.segmentIndex.twoDigitSegments[twoDigitKey];
      if (file) return file;
    }

    // 1-digit lookup (legacy format)
    if (this.segmentIndex.singleDigitSegments && prefix.length >= 1) {
      const digit = prefix.substring(0, 1);
      const file = this.segmentIndex.singleDigitSegments[digit];
      if (file) return file;
    }

    return null;
  }

  async searchByPrefix(prefix: string, limit: number = 15): Promise<Array<{ code: string; description: string }>> {
    console.log('[TariffSearchService] searchByPrefix called with:', prefix, 'limit:', limit);

    // Ensure we're initialized
    if (!this.isInitialized()) {
      console.log('[TariffSearchService] Not initialized, initializing...');
      await this.initialize();
    }

    if (!prefix || prefix.length === 0 || !this.segmentIndex) {
      console.log('[TariffSearchService] Early return - no prefix or no index');
      return [];
    }

    const results: Array<{ code: string; description: string }> = [];

    if (prefix.length === 1) {
      // For single digit, we might need to load multiple 2-digit segments
      const digit = prefix;

      // Determine whether we have 3- or 2-digit child segments beneath this digit
      const hasThreeDigitSegments = this.segmentIndex.segments
        ? Object.keys(this.segmentIndex.segments).some(key => key.startsWith(digit))
        : false;

      const hasTwoDigitSegments = this.segmentIndex.twoDigitSegments
        ? Object.keys(this.segmentIndex.twoDigitSegments).some(key => key.startsWith(digit))
        : false;

      console.log('[TariffSearchService] Single digit search:', digit, {
        hasThreeDigitSegments,
        hasTwoDigitSegments
      });

      // Helper to process a specific segment file and push matches into results
      const processSegment = async (segmentFile: string) => {
        const segmentData = await this.loadSegmentData(segmentFile);
        if (segmentData && segmentData.entries) {
          for (const entry of segmentData.entries) {
            const hts8 = entry.hts8 || '';
            if (hts8.startsWith(prefix)) {
              results.push({ code: hts8, description: entry.brief_description || '' });
              if (results.length >= limit) return true;
            }
          }
        }
        return false;
      };

      // 3-digit segments first (newer, more granular)
      if (hasThreeDigitSegments && this.segmentIndex.segments) {
        for (const [key, file] of Object.entries(this.segmentIndex.segments)) {
          if (!key.startsWith(digit)) continue;
          const done = await processSegment(file);
          if (done) return results;
        }
      }

      // Fall back to 2-digit segments if they exist
      if (hasTwoDigitSegments && this.segmentIndex.twoDigitSegments) {
        for (let i = 0; i <= 9; i++) {
          const twoDigitKey = digit + i;
          const segmentFile = this.segmentIndex.twoDigitSegments[twoDigitKey];
          if (segmentFile) {
            const done = await processSegment(segmentFile);
            if (done) return results;
          }
        }
      }

      // Finally fall back to the single-digit segment file itself, if present
      if (this.segmentIndex.singleDigitSegments) {
        const segmentFile = this.segmentIndex.singleDigitSegments[digit];
        if (segmentFile) await processSegment(segmentFile);
      }
    } else {
      // For 2+ digits, we use the most specific segment available.
      const segmentFile = this.getSegmentFileForPrefix(prefix);
      console.log(`[TariffSearchService] Multi-digit search for '${prefix}'. Using segment file: '${segmentFile}'`);

      if (segmentFile) {
        const segmentData = await this.loadSegmentData(segmentFile);
        if (segmentData && segmentData.entries) {
          for (const entry of segmentData.entries) {
            const hts8 = entry.hts8 || '';
            if (hts8.startsWith(prefix)) {
              results.push({ code: hts8, description: entry.brief_description || '' });
              if (results.length >= limit) {
                break; // Exit loop once limit is reached
              }
            }
          }
        }
      } else {
        console.log(`[TariffSearchService] No segment file found for prefix '${prefix}'`);
      }
    }

    // Sort results by code
    results.sort((a, b) => a.code.localeCompare(b.code));

    return results;
  }

  // Clear cached segments to free memory
  clearCache(): void {
    this.segmentCache.clear();
    console.log('🧹 Cleared segment cache');
  }

  getHtsRevision(): string {
    return this.segmentIndex?.metadata?.hts_revision || 'N/A';
  }
}

// Export singleton instance
export const tariffSearchService = TariffSearchService.getInstance();
