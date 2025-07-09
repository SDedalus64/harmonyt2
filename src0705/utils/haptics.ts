import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_KEY = "@HarmonyTi:userSettings";

// Define settings type
interface HapticSettings {
  hapticFeedback?: boolean;
}

// Cache settings to avoid frequent AsyncStorage reads
let cachedSettings: HapticSettings | null = null;

// Load settings into cache
async function loadSettings() {
  try {
    const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      cachedSettings = JSON.parse(savedSettings);
    }
  } catch (error) {
    console.error("Error loading haptic settings:", error);
  }
}

// Initialize settings cache
loadSettings();

// Update cache when settings change
export function updateHapticSettings(enabled: boolean) {
  if (!cachedSettings) {
    cachedSettings = { hapticFeedback: enabled };
  } else {
    cachedSettings.hapticFeedback = enabled;
  }
}

// Main haptic feedback function
async function triggerHaptic(
  type:
    | "light"
    | "medium"
    | "heavy"
    | "success"
    | "warning"
    | "error"
    | "selection",
) {
  // If no cached settings, load them first
  if (cachedSettings === null) {
    await loadSettings();
  }

  // Check if haptic feedback is disabled
  if (cachedSettings?.hapticFeedback === false) {
    return;
  }

  // Trigger appropriate haptic feedback
  try {
    switch (type) {
      case "light":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "success":
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        break;
      case "warning":
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
        break;
      case "error":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case "selection":
        await Haptics.selectionAsync();
        break;
    }
  } catch (error) {
    // Silently fail if haptics are not available
    console.debug("Haptic feedback failed:", error);
  }
}

// Exported haptic feedback functions
export const haptics = {
  // Button presses
  buttonPress: () => triggerHaptic("light"),

  // Important actions (Calculate, Save, etc.)
  impact: () => triggerHaptic("medium"),

  // Destructive actions (Clear, Delete, etc.)
  impactHeavy: () => triggerHaptic("heavy"),

  // Success states (Calculation complete, Saved, etc.)
  success: () => triggerHaptic("success"),

  // Warning states
  warning: () => triggerHaptic("warning"),

  // Error states
  error: () => triggerHaptic("error"),

  // Selection changes (Toggle switches, selecting from lists)
  selection: () => triggerHaptic("selection"),
};
