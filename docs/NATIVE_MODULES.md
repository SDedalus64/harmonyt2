# Native Modules Documentation

## Overview

This document describes the native module functionality in the HarmonyTi React Native application. Currently, the app uses fallback implementations for native features that would require platform-specific code.

## Current Status

### ✅ Implemented (Fallback Only)
- Screenshot prevention awareness (logging only)
- Apple Pencil detection (iPad detection only)
- Basic platform detection

### ❌ Not Implemented (Requires Native Modules)
- Actual screenshot prevention
- Real Apple Pencil interaction handling
- Screenshot detection events

## Module Details

### 1. Screenshot Prevention (`src/utils/screenshotPrevention.ts`)

**Current Behavior:**
- Logs when screenshot prevention is enabled/disabled
- No actual screenshot blocking occurs
- Safe fallback that won't crash the app

**To Implement Full Functionality:**

#### iOS Implementation Required:
```swift
// Native module to handle screenshot prevention
@objc(ScreenshotPrevention)
class ScreenshotPrevention: NSObject {

  @objc
  func enable() {
    // Add blur overlay when app goes to background
    // Listen for UIApplicationUserDidTakeScreenshotNotification
  }

  @objc
  func disable() {
    // Remove blur overlay and listeners
  }
}
```

#### Android Implementation Required:
```kotlin
// Native module to set FLAG_SECURE
class ScreenshotPreventionModule : ReactContextBaseJavaModule() {

  @ReactMethod
  fun enable() {
    currentActivity?.window?.setFlags(
      WindowManager.LayoutParams.FLAG_SECURE,
      WindowManager.LayoutParams.FLAG_SECURE
    )
  }

  @ReactMethod
  fun disable() {
    currentActivity?.window?.clearFlags(
      WindowManager.LayoutParams.FLAG_SECURE
    )
  }
}
```

### 2. Apple Pencil Support (`src/platform/pencilUtils.ts`)

**Current Behavior:**
- Detects if device is an iPad (where Apple Pencil could be available)
- Provides simulation in development mode
- Safe fallback that won't crash the app

**To Implement Full Functionality:**

#### iOS Implementation Required:
```swift
// Native module for Apple Pencil interactions
@objc(PencilManager)
class PencilManager: RCTEventEmitter {

  override func supportedEvents() -> [String]! {
    return ["pencilInteraction"]
  }

  @objc
  func startListening() {
    // Set up UIPencilInteraction
    // Handle pencil events and emit to React Native
  }
}
```

## Usage in Application

### Screenshot Prevention
```typescript
import { preventScreenshot, allowScreenshot } from '../utils/screenshotPrevention';

// Enable prevention (currently logs only)
preventScreenshot();

// Disable prevention
allowScreenshot();
```

### Apple Pencil Detection
```typescript
import { isApplePencilAvailable, usePencilInteraction } from '../platform/pencilUtils';

// Check if Apple Pencil could be available
const pencilAvailable = isApplePencilAvailable();

// Use pencil interaction hook (simulation only)
usePencilInteraction((event) => {
  console.log('Pencil interaction:', event);
}, true);
```

## Development vs Production

### Development Mode
- Simulation features are enabled for testing
- Console logs provide feedback about native module calls
- No crashes occur from missing native implementations

### Production Mode
- Fallback implementations provide safe defaults
- No simulation features active
- Graceful degradation of functionality

## Implementation Priority

If you decide to implement native modules, prioritize in this order:

1. **Screenshot Prevention (Android)** - Easier to implement with FLAG_SECURE
2. **Screenshot Prevention (iOS)** - More complex, requires background blur overlay
3. **Apple Pencil Support** - Specialized feature for iPad users

## Testing

Current fallback implementations can be tested by:

1. Running the app on both iOS and Android
2. Calling screenshot prevention functions
3. Using Apple Pencil simulation on iPad (development mode)
4. Checking console logs for expected behavior

## Migration Path

To add native modules:

1. Create native module files in `ios/` and `android/` directories
2. Update React Native bridge configuration
3. Replace fallback implementations with actual native calls
4. Test on physical devices with required hardware
5. Update this documentation

## Notes

- All current implementations are safe and won't cause crashes
- The app functions fully without native modules
- Native modules would enhance security and user experience
- Consider using existing React Native libraries before implementing custom modules
