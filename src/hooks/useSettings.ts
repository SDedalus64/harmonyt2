import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useCallback, useEffect } from 'react';

export interface AppSettings {
  autoSaveToHistory: boolean;
  showUnitCalculations: boolean;
  notifications: boolean;
  hapticFeedback: boolean;
  darkMode: boolean;
  cellularData: boolean;
  defaultCountry: string;
}

const SETTINGS_STORAGE_KEY = '@harmony_settings';

const DEFAULT_SETTINGS: AppSettings = {
  autoSaveToHistory: true, // Default to on
  showUnitCalculations: false,
  notifications: true,
  hapticFeedback: true,
  darkMode: false,
  cellularData: true,
  defaultCountry: 'CN', // China as default
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage
  const loadSettings = useCallback(async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save settings to storage
  const saveSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [settings]);

  // Update a specific setting
  const updateSetting = useCallback(async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    await saveSettings({ [key]: value });
  }, [saveSettings]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    isLoading,
    updateSetting,
    saveSettings,
  };
}
