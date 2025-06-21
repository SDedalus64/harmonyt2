# HarmonyTi Prebuild Instructions

## Overview
This document provides step-by-step instructions for performing a clean prebuild of the HarmonyTi app. Follow these steps exactly to ensure a successful build without warnings or errors.

## Prerequisites
- Xcode installed (latest stable version)
- Node.js and npm installed
- CocoaPods installed (`sudo gem install cocoapods`)
- All changes committed to git (recommended)

## Prerequisites - One-Time Environment Setup
Before you run **any** of the pre-build steps below, make sure your macOS environment is ready. You normally do this once per machine.

1. **Install Xcode** (from the Mac App Store or https://developer.apple.com/xcode/) and launch it once to accept the licence:
   ```bash
   # opens Xcode; you may be prompted to accept the licence
   open -a Xcode
   ```
2. **Install Xcode Command-Line Tools** (required by Homebrew, CocoaPods, etc.):
   ```bash
   xcode-select --install   # only if they are not already installed
   ```
3. **Install Homebrew** (skip if already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   brew update
   ```
4. **Install Node + npm** (use the LTS version):
   ```bash
   brew install node   # or use nvm if you prefer
   node -v             # verify
   npm -v
   ```
5. **Install CocoaPods** (Ruby gem):
   ```bash
   sudo gem install cocoapods
   pod --version        # verify
   ```
6. **Prepare your Git workspace** – commit or stash any outstanding changes before running the pre-build process:
   ```bash
   git status           # make sure the working tree is clean
   ```

> Once the above are in place, proceed to the **Step-by-Step Prebuild Process** below every time you need a fresh native project.

## Step-by-Step Prebuild Process

### 1. Close Xcode
**CRITICAL**: Make sure Xcode is completely closed before starting
```bash
# Verify Xcode is not running
ps aux | grep Xcode
```

### 2. Clean Previous Builds
```bash
# Remove old native directories and # Clear all caches
rm -rf ios android
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf $TMPDIR/react-*
```

### 2 b. Bump Build Number (optional but recommended)
Run this if you need a new internal build number (most releases):
```bash
npm run bump   # updates expo.ios.buildNumber and expo.android.versionCode
```
> If you also need to change the marketing version (`expo.version`), edit `app.json` manually and then commit both changes.

### 3. Install JavaScript Dependencies & Verify Metro Config (NEW)
Before touching any native code, make sure all JS dependencies are installed **and** that Metro is configured correctly.
```bash
# Install / update node modules (use `yarn` if you prefer)
npm install

# QUICK CHECK ‑ Metro config should load without errors and report SVG support
Run:
node -e "const cfg=require('./metro.config');\
  console.log('✅ Metro config loaded from expo/metro-config');\
  console.log('   SVG enabled:', cfg.resolver.sourceExts.includes('svg'));"
```


If you see a *MODULE_NOT_FOUND* error for `react-native-svg-transformer`, install it:

```bash
npm install --save-dev react-native-svg-transformer
```
> The check above prevents the `Serializer did not return expected format` error during native builds.

### 4. Run Prebuild
```bash
# Generate /ios and /android native projects (non-interactive)
EXPO_NO_INTERACTIVE=1 npx expo prebuild --platform ios --no-install

# Restore the tracked Podfile after prebuild
git checkout ios/Podfile


```

### 5. Install CocoaPods Dependencies
After `expo prebuild` has created/updated the native `ios` directory, install or update iOS pods:
```bash
# From the project root
cd .. (if in ios)
npx pod-install ios

rm -rf ios android && npx expo prebuild --clean
```
> This step will run `pod install` inside `ios/` and link all native iOS dependencies declared in `package.json`.

### 6. Run the Fix Script (CRITICAL STEP!)
**This is the most important step that fixes all Xcode warnings and permissions**
```bash
# Run the fix script
./fix-xcode-warnings.sh
```

Wait for the script to complete. You should see:
- ✅ Done! Common warning fixes applied.

### 7. Fix Sandbox Permissions
```bash
# Ensure expo configure script is executable
chmod +x "ios/Pods/Target Support Files/Pods-HarmonyTi/expo-configure-project.sh"
```

### 8. Open in Xcode
```bash
# Option A – from project root
open ios/HarmonyTi.xcworkspace

# Option B – if you are already inside the ios directory
cd ios
open HarmonyTi.xcworkspace
```

### 8 b. (Optional) Start the Metro Bundler
For **debug / simulator** runs you will need Metro running in a separate terminal.
```bash
# From project root (clears cache every time you start)
npm start
#   or
npx expo start -c
```
Do **not** include the `# ...` comments above when you copy-paste; they're just explanations and will cause `command not found: #` errors.

*When you press the ▶︎ button in Xcode, it will also try to spawn its own Metro instance; starting it yourself gives you faster logs and lets you reset the cache with `-c`.*

> You **do not** need Metro running when you use **Product → Archive** to create an App Store build; the native code is already bundled by Xcode in that case.

### 9. Xcode Setup
1. **Wait for indexing** to complete (progress bar at top)
2. **Clean Build Folder**: Product → Clean Build Folder (Cmd+Shift+K)
3. **Select Team**:
   - Click on HarmonyTi in the project navigator
   - Go to "Signing & Capabilities" tab
   - Select your development team
4. **Handle Dialogs**:
   - If asked about "uncommitted changes", click "Continue"
   - If asked about "recommended settings", click "Perform Changes"

### 10. Build and Archive
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
- [ ] Ran `npx expo prebuild --clean`
- [ ] **Ran `./fix-xcode-warnings.sh` script**
- [ ] Fixed sandbox permissions
- [ ] Opened .xcworkspace (not .xcodeproj)
- [ ] Selected development team
- [ ] Cleaned build folder in Xcode
- [ ] Selected "Any iOS Device (arm64)"

## Build Numbers
Remember to increment build numbers **before archiving** (and ideally before running prebuild so they are embedded automatically).

```bash
# Automatic bump (updates iOS buildNumber and Android versionCode in app.json)
npm run bump

# If you also need to change the marketing version, edit app.json manually:
#   "version": "2.6.0"
```

> The `npm run bump` script increments the numeric `expo.ios.buildNumber` and `expo.android.versionCode` fields in `app.json`. Commit the change, then re-run the pre-build steps. If you skip this, you can still edit the Build field directly in Xcode, but keeping it in `app.json` ensures consistency across local and CI builds.

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
npx expo prebuild --clean

# 3. Fix warnings (CRITICAL!)
./fix-xcode-warnings.sh

# 4. Fix permissions
chmod +x "ios/Pods/Target Support Files/Pods-HarmonyTi/expo-configure-project.sh"

echo "✅ Prebuild complete! Open ios/HarmonyTi.xcworkspace in Xcode"
```

Make it executable: `chmod +x prebuild-complete.sh`