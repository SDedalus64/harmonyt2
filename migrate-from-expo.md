# Migrating from Expo to React Native

## Overview
This guide helps migrate the RateCast app from Expo dependencies to pure React Native, which should improve build reliability.

## Current Expo Dependencies

1. **@expo/vector-icons** → **react-native-vector-icons**
2. **expo-status-bar** → **react-native StatusBar**
3. **expo-splash-screen** → **react-native-splash-screen**
4. **expo-notifications** → **react-native-push-notification** (if needed)
5. **expo** and **expo-modules-core** → Remove after migration

## Step-by-Step Migration

### Step 1: Install React Native replacements

```bash
npm uninstall @expo/vector-icons expo-status-bar expo-splash-screen expo-notifications expo expo-modules-core
npm install react-native-vector-icons react-native-splash-screen
cd ios && pod install && cd ..
```

### Step 2: Update imports

#### 2.1 Replace @expo/vector-icons

**Before:**
```typescript
import { Ionicons } from '@expo/vector-icons';
```

**After:**
```typescript
import Ionicons from 'react-native-vector-icons/Ionicons';
```

Files to update:
- `src/navigation/AppNavigator.tsx`
- `src/components/RightColumnContent.tsx`
- `src/components/CountryLookup.tsx`
- `src/components/SaveWorkCard.tsx`
- `src/screens/SettingsScreen.tsx`
- `src/components/SessionExportModal.tsx`
- `src/screens/RegistrationScreen.tsx`
- `src/screens/HistoryScreen.tsx`
- `src/screens/LinksScreen.tsx`
- `src/screens/LookupScreen.tsx`
- `src/components/shared/CountryLookup.tsx`

#### 2.2 Replace expo-status-bar

**Before:**
```typescript
import { StatusBar } from 'expo-status-bar';
// ...
<StatusBar style="light" />
```

**After:**
```typescript
import { StatusBar } from 'react-native';
// ...
<StatusBar barStyle="light-content" />
```

Files to update:
- `App.tsx`

### Step 3: Update index.ts

**Before:**
```typescript
import { registerRootComponent } from 'expo';
import App from './App';
registerRootComponent(App);
```

**After:**
```typescript
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

### Step 4: Configure react-native-vector-icons

#### iOS Configuration
Add to `ios/RateCast/Info.plist`:
```xml
<key>UIAppFonts</key>
<array>
  <string>Ionicons.ttf</string>
</array>
```

#### Android Configuration
Add to `android/app/build.gradle`:
```gradle
apply from: file("../../node_modules/react-native-vector-icons/fonts.gradle")
```

### Step 5: Update app.json

Remove Expo-specific configuration:
```json
{
  "name": "RateCast",
  "displayName": "RateCast",
  "version": "2.0.0"
}
```

### Step 6: Clean and rebuild

```bash
# Clean everything
rm -rf node_modules
rm -rf ios/Pods
rm -rf ios/build
rm -rf android/build
rm -rf android/.gradle
rm package-lock.json

# Reinstall
npm install
cd ios && pod install && cd ..

# Rebuild
npx react-native run-ios
npx react-native run-android
```

## Verification Checklist

- [ ] All icons display correctly
- [ ] Status bar appears correctly
- [ ] App launches without Expo errors
- [ ] Build size is reduced
- [ ] No Expo warnings in console

## Rollback Plan

If issues arise:
1. `git stash` or `git reset --hard`
2. `npm install` to restore Expo dependencies
3. `cd ios && pod install && cd ..`

## Benefits After Migration

1. **Smaller app size** - No Expo runtime overhead
2. **Faster builds** - Direct React Native builds
3. **Better debugging** - Native tools work better
4. **More control** - Direct access to native code
5. **Easier CI/CD** - Standard React Native build process
