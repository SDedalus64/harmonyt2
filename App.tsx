// @ts-nocheck - Temporarily disable TypeScript checking for this file
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-gesture-handler";
// @ts-ignore - Temporarily suppress TypeScript error for GestureHandlerRootView
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { AuthProvider, useAuth } from "./src/navigation/contexts/AuthContext";
import { View, ActivityIndicator, Platform } from "react-native";
import { TariffService } from "./src/services/tariffService";
import { tariffSearchService } from "./src/services/tariffSearchService";
import { blogService } from "./src/services/blogService";
import { SettingsProvider } from "./src/hooks/useSettings";
import * as ScreenOrientation from "expo-screen-orientation";
import { tariffCacheService } from "./src/services/tariffCacheService";
import { getAzureUrls } from "./src/config/azure.config";
import { AppState, AppStateStatus } from "react-native";

// First launch key for AsyncStorage
const FIRST_LAUNCH_KEY = "@HarmonyTi:firstLaunch";

// Keep a singleton instance reference at module level
const tariffService = TariffService.getInstance();

function AppContent() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const { isLoggedIn } = useAuth();
  const appState = React.useRef(AppState.currentState);

  // Function to check for cache updates
  const checkCacheUpdates = async () => {
    if (tariffService.isInitialized()) {
      try {
        const urls = getAzureUrls();
        await tariffCacheService.startBackgroundCaching(urls.segmentIndex);
        console.log("✅ Cache validation check complete");
      } catch (error) {
        console.warn("Cache validation failed:", error);
      }
    }
  };

  useEffect(() => {
    async function initializeApp() {
      try {
        console.log("App component initializing...");

        // Check first launch
        const hasLaunched = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
        if (hasLaunched === null) {
          await AsyncStorage.setItem(FIRST_LAUNCH_KEY, "false");
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }

        console.log("App initialization complete");
      } catch (error) {
        console.error("Error during app initialization:", error);
        setIsFirstLaunch(false);
      } finally {
        setIsInitializing(false);
      }
    }

    initializeApp();

    // Set up app state listener to check cache when app comes to foreground
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          console.log("App came to foreground, checking for tariff updates...");
          checkCacheUpdates();
        }
        appState.current = nextAppState;
      },
    );

    return () => {
      subscription.remove();
    };

    // Initialize heavy data services AFTER basic app state is ready
    async function initDataServices() {
      try {
        console.log("📦 Initializing data services...");

        // Fire both initializations in parallel
        await Promise.all([
          tariffSearchService.isInitialized()
            ? Promise.resolve()
            : tariffSearchService.initialize(),
          tariffService.isInitialized()
            ? Promise.resolve()
            : tariffService.initialize(),
        ]);

        console.log("✅ Data services ready");

        // Preload blog posts in the background
        console.log("📰 Preloading blog posts...");
        blogService.preloadBlogs();

        // After initialization is complete, do an initial cache check
        checkCacheUpdates();
      } catch (err) {
        console.warn("⚠️ Failed to initialize data services:", err);
      }

      // Lock to portrait on iPhones (allow free rotation on iPad & Android)
      if (Platform.OS === "ios" && !(Platform as any).isPad) {
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP,
        ).catch((err) => {
          console.warn("Unable to lock screen orientation:", err);
        });
      }
    }

    initDataServices();
  }, []);

  // Show loading state while auth is being initialized
  if (isInitializing || isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
