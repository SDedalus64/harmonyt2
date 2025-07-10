import AsyncStorage from '@react-native-async-storage/async-storage';
import { TariffEntry } from './tariffService';

// The data structure we expect for a segment file
interface SegmentData {
  segment: string;
  description: string;
  count: number;
  entries: TariffEntry[];
}

// --- Local Storage Configuration ---
const TARIFF_SEGMENT_PREFIX = '@TariffSegment:';
const CACHE_METADATA_KEY = '@TariffCacheMetadata';

interface CacheMetadata {
  lastUpdated: string;
  segmentationDate: string;
  downloadedSegments: string[];
}

// --- Priority List for Background Caching ---
// Based on top US import values. This ensures the most common
// data is cached first.
const PRIORITY_CHAPTERS = [
  // Top Priority
  '85', '84', '87', '94', '39', '90', '30',
  // Medium Priority
  '71', '95', '61', '62', '64', '42', '73',
  // Other major categories
  '29', '40', '48', '72', '76', '27', '96'
];


class TariffCacheService {
  /**
   * Retrieves a single tariff segment from AsyncStorage.
   */
  async getSegment(segmentFile: string): Promise<SegmentData | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(`${TARIFF_SEGMENT_PREFIX}${segmentFile}`);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('[TariffCacheService] Error reading segment from storage:', segmentFile, e);
      return null;
    }
  }

  /**
   * Saves a single tariff segment to AsyncStorage.
   */
  async setSegment(segmentFile: string, data: SegmentData): Promise<void> {
    try {
      const jsonValue = JSON.stringify(data);
      await AsyncStorage.setItem(`${TARIFF_SEGMENT_PREFIX}${segmentFile}`, jsonValue);
    } catch (e) {
      console.error('[TariffCacheService] Error saving segment to storage:', segmentFile, e);
    }
  }

  /**
   * Sorts the list of all available segments to prioritize
   * the most common commodity chapters.
   */
  private prioritizeSegments(allSegments: string[]): string[] {
    const prioritySet = new Set(PRIORITY_CHAPTERS);
    
    const prioritized: string[] = [];
    const others: string[] = [];

    allSegments.forEach(segmentFile => {
      // Filename is like 'tariff-851.json', we want '85'
      const chapter = segmentFile.substring(7, 9);
      if (prioritySet.has(chapter)) {
        prioritized.push(segmentFile);
      } else {
        others.push(segmentFile);
      }
    });
    
    // Sort prioritized segments to match the PRIORITY_CHAPTERS order
    prioritized.sort((a, b) => {
      const chapterA = a.substring(7, 9);
      const chapterB = b.substring(7, 9);
      return PRIORITY_CHAPTERS.indexOf(chapterA) - PRIORITY_CHAPTERS.indexOf(chapterB);
    });

    return [...prioritized, ...others];
  }

  /**
   * Kicks off the background process to download all tariff segments
   * and cache them locally for offline use and faster lookups.
   */
  async startBackgroundCaching(segmentIndexUrl: string): Promise<void> {
    console.log('[TariffCacheService] Starting background cache process...');
    
    try {
      // 1. Fetch the main segment index
      const indexResponse = await fetch(segmentIndexUrl);
      if (!indexResponse.ok) {
        throw new Error('Failed to fetch segment index for caching.');
      }
      const segmentIndex = await indexResponse.json();

      // 2. Get all segment filenames from all available maps
      const allSegmentFiles = [
        ...Object.values(segmentIndex.segments || {}),
        ...Object.values(segmentIndex.twoDigitSegments || {}),
        ...Object.values(segmentIndex.singleDigitSegments || {})
      ] as string[];
      
      const uniqueSegmentFiles = [...new Set(allSegmentFiles)];

      // 3. Get metadata about our local cache
      const metadata: CacheMetadata = JSON.parse(await AsyncStorage.getItem(CACHE_METADATA_KEY) || 'null') || {
        lastUpdated: '',
        segmentationDate: '',
        downloadedSegments: []
      };

      // 4. If the server data is newer, clear the old cache completely
      if (segmentIndex.metadata?.segmentationDate !== metadata.segmentationDate) {
        console.log('[TariffCacheService] Server data has been updated. Clearing old cache.');
        const keys = await AsyncStorage.getAllKeys();
        const segmentKeys = keys.filter(k => k.startsWith(TARIFF_SEGMENT_PREFIX));
        await AsyncStorage.multiRemove(segmentKeys);
        metadata.downloadedSegments = [];
        metadata.segmentationDate = segmentIndex.metadata?.segmentationDate;
      }
      
      // 5. Prioritize the download queue
      const downloadQueue = this.prioritizeSegments(uniqueSegmentFiles);

      // 6. Loop and download files not already in our cache
      for (const segmentFile of downloadQueue) {
        if (metadata.downloadedSegments.includes(segmentFile)) {
          continue; // Already cached
        }

        console.log(`[TariffCacheService] Background caching: ${segmentFile}`);
        // To be implemented: fetch and save logic
        // For now, we just log and update metadata.
        // The actual fetch will happen on-demand and be cached automatically.
        
        // This function's main job is to identify what *should* be cached.
        // The on-demand fetching in TariffSearchService will do the actual saving.
        // This prepares for a more advanced implementation where we can trigger
        // actual background downloads.
      }

      console.log('[TariffCacheService] Background cache check complete.');

    } catch (e) {
      console.error('[TariffCacheService] Background caching process failed:', e);
    }
  }
}

export const tariffCacheService = new TariffCacheService(); 