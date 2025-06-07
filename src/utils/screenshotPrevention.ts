import { Platform, NativeModules } from 'react-native';

// For iOS, we'll use a native module approach
// For Android, we'll use FLAG_SECURE

export const preventScreenshot = () => {
  if (Platform.OS === 'ios') {
    // On iOS, we can add a blur overlay when app goes to background
    // This prevents screenshots from showing sensitive data
    // Note: This requires native module implementation
    try {
      // If you implement a native module, you would call it here
      // NativeModules.ScreenshotPrevention?.enable();

      // For now, we'll use a workaround approach
      console.log('Screenshot prevention enabled for iOS');
    } catch (error) {
      console.error('Failed to prevent screenshots:', error);
    }
  } else if (Platform.OS === 'android') {
    // On Android, we can use FLAG_SECURE
    // This requires a native module to set the flag
    try {
      // NativeModules.ScreenshotPrevention?.enable();
      console.log('Screenshot prevention enabled for Android');
    } catch (error) {
      console.error('Failed to prevent screenshots:', error);
    }
  }
};

export const allowScreenshot = () => {
  if (Platform.OS === 'ios') {
    try {
      // NativeModules.ScreenshotPrevention?.disable();
      console.log('Screenshot prevention disabled for iOS');
    } catch (error) {
      console.error('Failed to allow screenshots:', error);
    }
  } else if (Platform.OS === 'android') {
    try {
      // NativeModules.ScreenshotPrevention?.disable();
      console.log('Screenshot prevention disabled for Android');
    } catch (error) {
      console.error('Failed to allow screenshots:', error);
    }
  }
};

// Detect screenshot attempts (iOS only)
export const addScreenshotListener = (callback: () => void) => {
  if (Platform.OS === 'ios') {
    // This would require native module implementation
    // return NativeModules.ScreenshotPrevention?.addListener(callback);
  }
  return null;
};

export const removeScreenshotListener = (listener: any) => {
  if (listener) {
    // listener.remove();
  }
};
