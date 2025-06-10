import React, { useState, useCallback, useEffect, useContext, createContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface SettingsContextValue {
  settings: AppSettings;
  isLoading: boolean;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  saveSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
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

  return (
    <SettingsContext.Provider value={{ settings, isLoading, updateSetting, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
