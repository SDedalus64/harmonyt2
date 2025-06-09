import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useCallback } from 'react';

export interface HistoryItem {
  id: string;
  htsCode: string;
  // Updated to store both country code and name
  countryCode: string;
  countryName: string;
  description: string;
  dutyRate: number;
  declaredValue: number;
  freightCost?: number;
  totalAmount: number;
  // Added special rate information
  specialRate?: {
    rate: number;
    description: string;
  };
  breakdown?: string[];
  components?: { type: string; rate: number; amount: number; label?: string }[];
  fees?: {
    mpf: { rate: number; amount: number };
    hmf: { rate: number; amount: number };
  };
  timestamp: number;
  // For backward compatibility
  country?: string;
  // Unit calculations
  unitCount?: string;
  unitCalculations?: {
    costPerUnitWithRT: number;
    costPerUnitWithoutRT?: number;
    additionalPerUnit?: number;
    hasRT: boolean;
  };
}

const HISTORY_STORAGE_KEY = '@HarmonyTi:history';

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      console.log('[loadHistory] Loading from key:', HISTORY_STORAGE_KEY);
      const savedHistory = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      console.log('[loadHistory] Raw data from storage:', savedHistory);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        console.log('[loadHistory] Parsed history length:', parsedHistory.length);

        // Handle backward compatibility for older history items
        const updatedHistory = parsedHistory.map((item: any) => {
          // If item has old 'country' field but not the new fields
          if (item.country && (!item.countryCode || !item.countryName)) {
            // Try to find the country name from our countries list
            const countries = [
              { code: 'AU', name: 'Australia' },
              { code: 'BR', name: 'Brazil' },
              { code: 'CA', name: 'Canada' },
              { code: 'CH', name: 'Switzerland' },
              { code: 'CL', name: 'Chile' },
              { code: 'CN', name: 'China' },
              { code: 'CU', name: 'Cuba' },
              { code: 'DE', name: 'Germany' },
              { code: 'EU', name: 'European Union' },
              { code: 'FR', name: 'France' },
              { code: 'GB', name: 'United Kingdom' },
              { code: 'IL', name: 'Israel' },
              { code: 'IN', name: 'India' },
              { code: 'IT', name: 'Italy' },
              { code: 'JP', name: 'Japan' },
              { code: 'KP', name: 'North Korea' },
              { code: 'KR', name: 'South Korea' },
              { code: 'MX', name: 'Mexico' },
              { code: 'MY', name: 'Malaysia' },
              { code: 'NO', name: 'Norway' },
              { code: 'NL', name: 'Netherlands' },
              { code: 'NZ', name: 'New Zealand' },
              { code: 'PE', name: 'Peru' },
              { code: 'PH', name: 'Philippines' },
              { code: 'RU', name: 'Russia' },
              { code: 'SG', name: 'Singapore' },
              { code: 'TH', name: 'Thailand' },
              { code: 'TR', name: 'Turkey' },
              { code: 'US', name: 'United States' },
              { code: 'VN', name: 'Vietnam' },
              { code: 'ZA', name: 'South Africa' },
            ];

            const foundCountry = countries.find(c => c.code === item.country);
            const countryName = foundCountry ? foundCountry.name : item.country;

            return {
              ...item,
              countryCode: item.country,
              countryName: countryName,
            };
          }
          return item;
        });

        setHistory(updatedHistory);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const saveToHistory = useCallback(async (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    if (historyLoading) {
      // Prevent saving while loading/clearing
      console.warn('[saveToHistory] Blocked: history is loading/clearing');
      return;
    }
    try {
      console.log('[saveToHistory] Saving item with country:', {
        code: item.countryCode,
        name: item.countryName
      });

      // Always get the latest history from storage
      const existingHistory = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      const historyItems: HistoryItem[] = existingHistory ? JSON.parse(existingHistory) : [];

      // Create new history item
      const newItem: HistoryItem = {
        ...item,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
      };

      // Add to start of array (most recent first)
      const updatedHistory = [newItem, ...historyItems];

      // Keep only last 50 items
      const trimmedHistory = updatedHistory.slice(0, 50);

      // Save to storage
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmedHistory));
      console.log('[saveToHistory] Saved to AsyncStorage with key:', HISTORY_STORAGE_KEY);
      console.log('[saveToHistory] Total items in history:', trimmedHistory.length);
      console.log('[saveToHistory] Latest item:', trimmedHistory[0]);

      // Update local state immediately to reflect changes
      setHistory(trimmedHistory);
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }, [historyLoading]);

  const clearHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      console.log('[clearHistory] Removing history from storage...');
      await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
      // Fallback: force set to empty array in case removeItem fails
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([]));

      // Directly update the local state to empty array
      setHistory([]);

      console.log('[clearHistory] History cleared.');
    } catch (error) {
      console.error('Error clearing history:', error);
      // Force local state to empty even on error
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  return {
    history,
    historyLoading,
    saveToHistory,
    loadHistory,
    clearHistory,
  };
}
