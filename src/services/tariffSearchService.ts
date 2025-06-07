import { TariffEntry } from './tariffService';
import { AZURE_CONFIG, getAzureUrls } from '../config/azure.config';

interface SegmentData {
  segment: string;
  description: string;
  count: number;
  entries: TariffEntry[];
}

interface SegmentIndex {
  singleDigitSegments: { [key: string]: string };
  twoDigitSegments: { [key: string]: string };
  metadata: {
    totalEntries: number;
    lastUpdated: string;
    segmentationDate: string;
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
        singleDigit: Object.keys(this.segmentIndex?.singleDigitSegments || {}),
        twoDigit: Object.keys(this.segmentIndex?.twoDigitSegments || {}).length + ' segments',
        twoDigitKeys: Object.keys(this.segmentIndex?.twoDigitSegments || {})
      });
    } catch (error) {
      console.error('❌ Failed to initialize TariffSearchService:', error);
      throw error;
    }
  }

  private async loadSegmentData(segmentFile: string): Promise<SegmentData | null> {
    // Check cache first
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

      // Cache the segment
      this.segmentCache.set(segmentFile, segmentData);

      console.log(`✅ Loaded segment ${segmentFile} with ${segmentData.entries?.length || 0} entries`);

      return segmentData;
    } catch (error) {
      console.error(`Failed to load segment ${segmentFile}:`, error);
      return null;
    }
  }

  private getSegmentFileForPrefix(prefix: string): string | null {
    if (!this.segmentIndex) return null;

    // For 1-digit prefix, check if it needs 2-digit segmentation
    if (prefix.length === 1) {
      // First check if this digit has 2-digit segments
      const twoDigitKey = prefix + '0';
      if (this.segmentIndex.twoDigitSegments[twoDigitKey]) {
        // This digit is segmented by 2 digits, don't return a file yet
        return null;
      }
      // Otherwise, return the single-digit segment file
      return this.segmentIndex.singleDigitSegments[prefix] || null;
    }

    // For 2+ digit prefix, check 2-digit segments
    if (prefix.length >= 2) {
      const twoDigitPrefix = prefix.substring(0, 2);
      console.log('[getSegmentFileForPrefix] Looking for:', twoDigitPrefix, 'in:', Object.keys(this.segmentIndex.twoDigitSegments || {}).slice(0, 10));
      return this.segmentIndex.twoDigitSegments[twoDigitPrefix] || null;
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

    // Determine which segment(s) to load
    if (prefix.length === 1) {
      // For single digit, we might need to load multiple 2-digit segments
      const digit = prefix;

      // Check if this digit has 2-digit segments
      const hasTwoDigitSegments = Object.keys(this.segmentIndex.twoDigitSegments)
        .some(key => key.startsWith(digit));

      console.log('[TariffSearchService] Single digit search:', digit, 'hasTwoDigitSegments:', hasTwoDigitSegments);

      if (hasTwoDigitSegments) {
        // Load all 2-digit segments for this digit
        for (let i = 0; i <= 9; i++) {
          const twoDigitKey = digit + i;
          const segmentFile = this.segmentIndex.twoDigitSegments[twoDigitKey];
          if (segmentFile) {
            const segmentData = await this.loadSegmentData(segmentFile);
            if (segmentData && segmentData.entries) {
              // Add matching entries from this segment
              for (const entry of segmentData.entries) {
                const hts8 = entry.hts8 || '';
                if (hts8.startsWith(prefix)) {
                  results.push({
                    code: hts8,
                    description: entry.brief_description || ''
                  });

                  if (results.length >= limit) {
                    return results;
                  }
                }
              }
            }
          }
        }
      } else {
        // Load the single-digit segment
        const segmentFile = this.segmentIndex.singleDigitSegments[digit];
        if (segmentFile) {
          const segmentData = await this.loadSegmentData(segmentFile);
          if (segmentData && segmentData.entries) {
            // Add matching entries
            for (const entry of segmentData.entries) {
              const hts8 = entry.hts8 || '';
              if (hts8.startsWith(prefix)) {
                results.push({
                  code: hts8,
                  description: entry.brief_description || ''
                });

                if (results.length >= limit) {
                  return results;
                }
              }
            }
          }
        }
      }
        } else {
      // For 2+ digits, first try the specific two-digit segment
      let segmentFile = this.getSegmentFileForPrefix(prefix);

      // If no two-digit segment found, try the single-digit segment
      if (!segmentFile && prefix.length >= 2) {
        const singleDigit = prefix.substring(0, 1);
        segmentFile = this.segmentIndex.singleDigitSegments[singleDigit] || null;
        console.log('[TariffSearchService] Falling back to single-digit segment:', singleDigit, 'file:', segmentFile);
      }

      console.log('[TariffSearchService] Multi-digit search:', prefix, 'segmentFile:', segmentFile);

      if (segmentFile) {
        const segmentData = await this.loadSegmentData(segmentFile);
        if (segmentData && segmentData.entries) {
          // Filter entries that match the prefix
          for (const entry of segmentData.entries) {
            const hts8 = entry.hts8 || '';
            if (hts8.startsWith(prefix)) {
              results.push({
                code: hts8,
                description: entry.brief_description || ''
              });

              if (results.length >= limit) {
                return results;
              }
            }
          }
        }
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
}

// Export singleton instance
export const tariffSearchService = TariffSearchService.getInstance();
