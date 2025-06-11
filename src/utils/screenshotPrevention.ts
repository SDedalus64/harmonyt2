import { Platform } from 'react-native';

/**
 * Screenshot Prevention Utilities
 *
 * Note: This module provides basic screenshot prevention awareness.
 * For full screenshot prevention, native modules would need to be implemented.
 *
 * Current implementation:
 * - iOS: Logs prevention status (native module required for actual prevention)
 * - Android: Logs prevention status (FLAG_SECURE native implementation required)
 */

export const preventScreenshot = (): void => {
  if (Platform.OS === 'ios') {
    // iOS screenshot prevention would require:
    // 1. Native module to add blur overlay when app goes to background
    // 2. UIApplicationUserDidTakeScreenshotNotification listener
    console.log('Screenshot prevention enabled for iOS (logging only - native module required for full functionality)');
  } else if (Platform.OS === 'android') {
    // Android screenshot prevention would require:
    // 1. Native module to set FLAG_SECURE on the activity window
    // 2. WindowManager.LayoutParams.FLAG_SECURE implementation
    console.log('Screenshot prevention enabled for Android (logging only - native module required for full functionality)');
  }
};

export const allowScreenshot = (): void => {
  if (Platform.OS === 'ios') {
    console.log('Screenshot prevention disabled for iOS');
  } else if (Platform.OS === 'android') {
    console.log('Screenshot prevention disabled for Android');
  }
};

/**
 * Screenshot detection (iOS only)
 *
 * Note: This would require a native module to implement
 * UIApplicationUserDidTakeScreenshotNotification listener
 *
 * @param callback Function to call when screenshot is detected
 * @returns null (no listener implemented)
 */
export const addScreenshotListener = (callback: () => void): null => {
  if (Platform.OS === 'ios') {
    console.log('Screenshot listener would be added here (native module required)');
    // For development, you could simulate screenshot detection:
    // setTimeout(() => callback(), 5000); // Simulate screenshot after 5 seconds
  }
  return null;
};

/**
 * Remove screenshot listener
 *
 * @param listener The listener to remove (currently unused)
 */
export const removeScreenshotListener = (listener: any): void => {
  if (listener) {
    console.log('Screenshot listener would be removed here');
  }
};
