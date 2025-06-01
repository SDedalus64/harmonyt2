import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DutyComponent {
  type: string;
  rate: number;
  amount: number;
  label?: string;
  description?: string;
}

export interface HistoryItem {
  id: string;
  htsCode: string;
  countryCode: string;
  countryName: string;
  description: string;
  dutyRate: number;
  declaredValue: number;
  totalAmount: number;
  components?: DutyComponent[];
  fees?: {
    mpf: { rate: number; amount: number };
    hmf: { rate: number; amount: number };
  };
  breakdown?: string[];
  specialRate?: {
    rate: number;
    description: string;
  };
  timestamp: number;
}

const HISTORY_STORAGE_KEY = '@RateCast:history';

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const storedHistory = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }, []);

  const saveToHistory = useCallback(async (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    try {
      const newItem: HistoryItem = {
        ...item,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };

      const updatedHistory = [newItem, ...history];
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
      setHistory(updatedHistory);
    } catch (error) {
      console.error('Error saving to history:', error);
      throw error;
    }
  }, [history]);

  const clearHistory = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
      setHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  }, []);

  return {
    history,
    loadHistory,
    saveToHistory,
    clearHistory,
  };
};
