import React, { useState, useEffect, useRef } from 'react';
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

// First launch key for AsyncStorage
const FIRST_LAUNCH_KEY = '@HarmonyTi:firstLaunch';

function AppContent() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    async function initializeApp() {
      try {
        console.log('App initializing...');

        // First, initialize the search service for segmented data
        // This is used for autocomplete as users type
        if (!tariffSearchService.isInitialized()) {
          console.log('🔍 Starting search service initialization (priority)...');
          tariffSearchService.initialize().then(() => {
            console.log('✅ Search service initialized - autocomplete ready');

            // After search service is ready, start loading the main tariff data
            const tariffService = TariffService.getInstance();
            if (!tariffService.isInitialized()) {
              console.log('🚀 Starting main tariff data preload in background...');
              tariffService.initialize().then(() => {
                console.log('✅ Main tariff data preload completed');
              }).catch((error) => {
                console.warn('⚠️ Main tariff data preload failed:', error);
              });
            }
          }).catch((error) => {
            console.warn('⚠️ Search service initialization failed:', error);

            // Even if search fails, try to load main data
            const tariffService = TariffService.getInstance();
            if (!tariffService.isInitialized()) {
              console.log('🚀 Starting main tariff data preload (fallback)...');
              tariffService.initialize().catch((err) => {
                console.warn('⚠️ Main tariff data preload also failed:', err);
              });
            }
          });
        }

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
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
