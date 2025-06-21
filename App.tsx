import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider, useAuth } from './src/navigation/contexts/AuthContext';
import { View, ActivityIndicator, AppState } from 'react-native';
import { TariffService } from './src/services/tariffService';
import { tariffSearchService } from './src/services/tariffSearchService';
import { SettingsProvider } from './src/hooks/useSettings';

// First launch key for AsyncStorage
const FIRST_LAUNCH_KEY = '@HarmonyTi:firstLaunch';

// Keep a singleton instance reference at module level
const tariffService = TariffService.getInstance();

function AppContent() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [dataInitializing, setDataInitializing] = useState(true);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    async function initializeApp() {
      try {
        console.log('App component initializing...');

        // Check first launch
        const hasLaunched = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
        if (hasLaunched === null) {
          await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'false');
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }

        console.log('App initialization complete');
      } catch (error) {
        console.error('Error during app initialization:', error);
        setIsFirstLaunch(false);
      } finally {
        setIsInitializing(false);
      }
    }

    initializeApp();

    // Initialize heavy data services AFTER basic app state is ready
    async function initDataServices() {
      try {
        console.log('📦 Initializing data services...');

        // Fire both initializations in parallel
        await Promise.all([
          tariffSearchService.isInitialized() ? Promise.resolve() : tariffSearchService.initialize(),
          tariffService.isInitialized() ? Promise.resolve() : tariffService.initialize(),
        ]);

        console.log('✅ Data services ready');
      } catch (err) {
        console.warn('⚠️ Failed to initialize data services:', err);
      } finally {
        setDataInitializing(false);
      }
    }

    initDataServices();
  }, []);

  // Show loading state while auth is being initialized
  if (isInitializing || isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0A99F2" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <AppNavigator
        isAuthenticated={isLoggedIn}
        isFirstLaunch={isFirstLaunch}
      />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <AuthProvider>
        <SettingsProvider>
        <AppContent />
        </SettingsProvider>
      </AuthProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
