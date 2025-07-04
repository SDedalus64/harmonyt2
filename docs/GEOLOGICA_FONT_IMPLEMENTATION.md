# Geologica Font Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the Geologica font family throughout the HarmonyTi app.

## Current Status

- ✅ BRAND_TYPOGRAPHY configuration has been updated to use "Geologica" as the primary and secondary font
- ⏳ Font files need to be added to the project
- ⏳ Native configurations need to be updated

## Required Steps

### 1. Obtain Geologica Font Files

Download the Geologica font family files in the following formats:

- `.ttf` or `.otf` files for React Native
- All necessary weights: Light (300), Regular (400), Medium (500), SemiBold (600), Bold (700)

Font source: [Google Fonts - Geologica](https://fonts.google.com/specimen/Geologica)

### 2. Add Font Files to Project

Create a fonts directory and add the font files:

```bash
mkdir -p assets/fonts
```

Add the following font files to `assets/fonts/`:

- Geologica-Light.ttf
- Geologica-Regular.ttf
- Geologica-Medium.ttf
- Geologica-SemiBold.ttf
- Geologica-Bold.ttf

### 3. Configure iOS (react-native.config.js)

Create or update `react-native.config.js` in the project root:

```javascript
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ["./assets/fonts/"],
};
```

### 4. Link Font Assets

Run the following command to link fonts:

```bash
npx react-native-asset
```

This will automatically:

- Add fonts to iOS Info.plist
- Copy fonts to Android assets

### 5. iOS Specific Configuration

The linking command should automatically add the fonts to `ios/HarmonyTi/Info.plist`:

```xml
<key>UIAppFonts</key>
<array>
    <string>Geologica-Light.ttf</string>
    <string>Geologica-Regular.ttf</string>
    <string>Geologica-Medium.ttf</string>
    <string>Geologica-SemiBold.ttf</string>
    <string>Geologica-Bold.ttf</string>
</array>
```

### 6. Android Specific Configuration

Fonts should be automatically copied to `android/app/src/main/assets/fonts/`

### 7. Update Font References

The BRAND_TYPOGRAPHY configuration has already been updated. The font family names to use in React Native are:

```javascript
// For different weights, use:
fontFamily: "Geologica-Light"; // 300 weight
fontFamily: "Geologica-Regular"; // 400 weight
fontFamily: "Geologica-Medium"; // 500 weight
fontFamily: "Geologica-SemiBold"; // 600 weight
fontFamily: "Geologica-Bold"; // 700 weight
```

### 8. Platform-Specific Font Names

Update `src/config/brandColors.ts` to handle platform-specific font names:

```typescript
import { Platform } from "react-native";

const getFontFamily = (weight: keyof typeof BRAND_TYPOGRAPHY.weights) => {
  const fontMap = {
    light: "Geologica-Light",
    regular: "Geologica-Regular",
    medium: "Geologica-Medium",
    semibold: "Geologica-SemiBold",
    bold: "Geologica-Bold",
  };

  return Platform.select({
    ios: fontMap[weight],
    android: fontMap[weight],
    default: "Geologica",
  });
};
```

### 9. Clean and Rebuild

After adding fonts:

```bash
# iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Android
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

## Verification

To verify fonts are loaded correctly:

1. Check that text elements display with Geologica font
2. Verify all font weights render correctly
3. Test on both iOS and Android devices/simulators

## Troubleshooting

### iOS Issues

- Ensure font files are included in Xcode project
- Check that font names in Info.plist match exactly
- Try cleaning build folder: Xcode → Product → Clean Build Folder

### Android Issues

- Verify fonts are in `android/app/src/main/assets/fonts/`
- Font names are case-sensitive on Android
- Clear gradle cache: `cd android && ./gradlew clean`

### Font Not Displaying

- Double-check font file names match exactly in code
- Ensure font files are not corrupted
- Try using the exact PostScript name of the font

## Font Weight Mapping

The app uses the following font weights throughout:

- Light (300): Used sparingly for subtle text
- Regular (400): Default body text
- Medium (500): Subheadings and emphasis
- SemiBold (600): Important labels and buttons
- Bold (700): Headers and strong emphasis

All components will automatically use the correct Geologica weight based on the `fontWeight` specified in their styles.
