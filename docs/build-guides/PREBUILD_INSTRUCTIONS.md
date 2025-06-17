# HarmonyTi Prebuild Instructions

## Overview
This document provides step-by-step instructions for performing a clean prebuild of the HarmonyTi app. Follow these steps exactly to ensure a successful build without warnings or errors.

## Prerequisites
- Xcode installed (latest stable version)
- Node.js and npm installed
- CocoaPods installed (`sudo gem install cocoapods`)
- All changes committed to git (recommended)

## Step-by-Step Prebuild Process

### 1. Close Xcode
**CRITICAL**: Make sure Xcode is completely closed before starting
```bash
# Verify Xcode is not running
ps aux | grep Xcode
```

### 2. Clean Previous Builds
```bash
# Remove old native directories
rm -rf ios android

# Clear all caches
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf $TMPDIR/react-*
```

### 3. Run Prebuild
```bash
# Generate fresh native projects
npx expo prebuild

# If you see "directory not empty" errors, use:
rm -rf ios android && npx expo prebuild
```

### 4. Run the Fix Script (CRITICAL STEP!)
**This is the most important step that fixes all Xcode warnings and permissions**
```bash
# Make the script executable (only needed once)
chmod +x fix-xcode-warnings.sh

# Run the fix script
./fix-xcode-warnings.sh
```

Wait for the script to complete. You should see:
- ✅ Done! Common warning fixes applied.

### 5. Fix Sandbox Permissions
```bash
# Ensure expo configure script is executable
chmod +x "ios/Pods/Target Support Files/Pods-HarmonyTi/expo-configure-project.sh"
```

### 6. Open in Xcode
```bash
# Open the workspace (NOT the .xcodeproj)
open ios/HarmonyTi.xcworkspace
```

### 7. Xcode Setup
1. **Wait for indexing** to complete (progress bar at top)
2. **Clean Build Folder**: Product → Clean Build Folder (Cmd+Shift+K)
3. **Select Team**:
   - Click on HarmonyTi in the project navigator
   - Go to "Signing & Capabilities" tab
   - Select your development team
4. **Handle Dialogs**:
   - If asked about "uncommitted changes", click "Continue"
   - If asked about "recommended settings", click "Perform Changes"

### 8. Build and Archive
1. **Select Device**: Choose "Any iOS Device (arm64)" from the device selector
2. **Archive**: Product → Archive
3. **Wait**: The build process may take 5-10 minutes
4. **Distribute**: Once archived, click "Distribute App" → "App Store Connect"

## Common Issues and Solutions

### Issue: "Sandbox: bash deny file-read-data"
**Solution**: Already fixed by step 5, but if it persists:
```bash
cd ios && pod deintegrate && pod install
```

### Issue: Build fails with signing errors
**Solution**:
- Ensure you're logged into Xcode with your Apple ID
- Check that your provisioning profiles are up to date
- Try: Xcode → Settings → Accounts → Download Manual Profiles

### Issue: Metro bundler errors
**Solution**:
```bash
# Kill any running Metro processes
killall -9 node
# Clear watchman
watchman watch-del-all
# Start fresh
npx expo start --clear
```

### Quick Commands: Port 8081 In Use
```bash
lsof -i :8081
kill -9 $(lsof -t -i :8081)
npm start
```

### Issue: Pod installation fails
**Solution**:
```bash
cd ios
pod repo update
pod install --repo-update
cd ..
```

## Checklist Before Building

- [ ] Xcode is closed before starting
- [ ] Git changes are committed (recommended)
- [ ] Removed old ios/android directories
- [ ] Ran `npx expo prebuild`
- [ ] **Ran `./fix-xcode-warnings.sh` script**
- [ ] Fixed sandbox permissions
- [ ] Opened .xcworkspace (not .xcodeproj)
- [ ] Selected development team
- [ ] Cleaned build folder in Xcode
- [ ] Selected "Any iOS Device (arm64)"

## Build Numbers
Remember to increment build numbers before archiving:
```bash
# Automatic increment
npm run bump

# Or manual increment in app.json:
# iOS: "buildNumber"
# Android: "versionCode"
```

## For CI/CD or Automated Builds

Create a script `prebuild-complete.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 Starting complete prebuild process..."

# 1. Clean
rm -rf ios android
rm -rf ~/Library/Developer/Xcode/DerivedData

# 2. Prebuild
npx expo prebuild

# 3. Fix warnings (CRITICAL!)
./fix-xcode-warnings.sh

# 4. Fix permissions
chmod +x "ios/Pods/Target Support Files/Pods-HarmonyTi/expo-configure-project.sh"

echo "✅ Prebuild complete! Open ios/HarmonyTi.xcworkspace in Xcode"
```

Make it executable: `chmod +x prebuild-complete.sh`
Then just run: `./prebuild-complete.sh`

## Important Notes

1. **Always run the fix script** - This is the most critical step that resolves 90% of build issues
2. **Use the workspace** - Always open .xcworkspace, never .xcodeproj
3. **Be patient** - Let Xcode fully index before building
4. **Commit first** - Always commit your changes before prebuild in case you need to revert

## Support

If you encounter issues not covered here:
1. Check the Expo documentation
2. Run `expo doctor` to diagnose issues
3. Check the React Native upgrade helper
4. Review recent changes in git log

Last updated: December 2024
Version: 1.0
