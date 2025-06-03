# Project Cleanup Plan for Harmony/RateCast

## Overview
This document outlines a systematic approach to clean up the codebase, remove orphan files, and address build issues.

## Phase 1: Immediate Cleanup (Safe to Delete)

### 1.1 Orphan Files in Root Directory
These files appear to be unused and can be safely deleted:

- `Archive.zip` (86MB) - Large backup file
- `Archive 2.zip` (766KB) - Another backup file
- `~$Tariff_Programs.xlsx` - Temporary Excel file
- `bundletool.jar` (9B) - Appears corrupted/empty
- `icon.ai` (75KB) - Adobe Illustrator file, not used in build

### 1.2 Duplicate/Unused Data Files
- `scripts/tariffnew.json` (27MB) - Not referenced anywhere
- `Tariff.json` (12MB) - Appears to be old version
- `htsdata.json` (12MB) - Appears to be old version
- `tariff_database_2025.xlsx` (5.5MB) - Source file, not used in app
- `HTS Cross-Reference Table for Tariff Rates (May 31, 2025).csv` - Source file
- `htscrossref20250531.csv` - Duplicate of above

**Note**: Keep `src/data/tariff_processed.json` as it's actively used by the app.

### 1.3 Test/Example Scripts
These can be moved to a separate `examples` folder or deleted:
- `analyze_hts_examples.js`
- `find_example_hts_codes.js`
- `check_hts_code.js`
- `test_additive_duties.ts`

### 1.4 Personal/Documentation Files
- `EMAIL_TO_BROTHER.txt` - Personal file

## Phase 2: Code Cleanup

### 2.1 Empty/Unused Components
- `src/screens/TestScreen.tsx` - Empty file but referenced in navigation
- `src/components/DrawerSocialContent.tsx` - Not imported anywhere

### 2.2 Duplicate Components
- `src/components/CountryLookup.tsx` and `src/components/shared/CountryLookup.tsx` - Investigate which is used

### 2.3 Build Artifacts to Clean
```bash
# Clean iOS build artifacts
cd ios && rm -rf build/ && cd ..
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Clean Android build artifacts
cd android && ./gradlew clean && cd ..

# Clean Metro cache
npx react-native start --reset-cache

# Clean node_modules and reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

## Phase 3: Expo to React Native Migration

### 3.1 Current Expo Dependencies
```json
{
  "expo": "~50.0.5",
  "expo-modules-core": "~1.11.8",
  "expo-notifications": "~0.27.6",
  "expo-splash-screen": "~0.26.4",
  "expo-status-bar": "~1.11.1",
  "@expo/vector-icons": "^14.0.0"
}
```

### 3.2 Migration Steps
1. Replace `expo-status-bar` with `react-native` StatusBar
2. Replace `@expo/vector-icons` with `react-native-vector-icons`
3. Replace `expo-splash-screen` with `react-native-splash-screen`
4. Remove `expo-notifications` if not used or replace with `react-native-push-notification`

## Phase 4: Build Optimization

### 4.1 iOS Build Issues
- Run `fix-xcode-warnings.sh` to address warnings
- Update Podfile to use newer pod versions
- Consider removing unused pods

### 4.2 Android Build Issues
- Update gradle version
- Clean gradle cache: `cd android && ./gradlew clean && cd ..`
- Update build tools version

## Implementation Script

Create `cleanup.sh`:

```bash
#!/bin/bash

echo "Starting project cleanup..."

# Phase 1: Delete orphan files
echo "Removing orphan files..."
rm -f Archive.zip "Archive 2.zip" "~\$Tariff_Programs.xlsx" bundletool.jar icon.ai
rm -f EMAIL_TO_BROTHER.txt
rm -f Tariff.json htsdata.json tariff_database_2025.xlsx
rm -f "HTS Cross-Reference Table for Tariff Rates (May 31, 2025).csv" htscrossref20250531.csv
rm -f scripts/tariffnew.json

# Move test scripts
echo "Moving test scripts..."
mkdir -p examples
mv analyze_hts_examples.js find_example_hts_codes.js check_hts_code.js test_additive_duties.ts examples/ 2>/dev/null || true

# Clean build artifacts
echo "Cleaning build artifacts..."
rm -rf ios/build
rm -rf android/build
rm -rf android/.gradle
rm -rf .expo

# Clean node_modules
echo "Clean installing dependencies..."
rm -rf node_modules
rm -f package-lock.json
npm install

echo "Cleanup complete!"
```

## Verification Steps

After cleanup, verify:
1. Run `npm start` to ensure Metro bundler works
2. Run `npm run ios` to test iOS build
3. Run `npm run android` to test Android build
4. Check all screens still load correctly
5. Verify tariff lookup functionality works

## Rollback Plan

Before starting:
1. Create a git branch: `git checkout -b cleanup`
2. Commit all changes
3. If issues arise, rollback: `git checkout main`

## Size Reduction Expected

- Archive files: ~87MB
- Duplicate tariff files: ~56MB
- Total expected reduction: ~143MB

## Next Steps

1. After cleanup, update `.gitignore` to prevent re-adding these files
2. Consider using Git LFS for large data files if needed
3. Set up CI/CD to catch build issues early
4. Document the final project structure
