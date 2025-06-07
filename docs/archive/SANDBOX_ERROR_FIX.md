# Sandbox Error Fix Guide

## The Error
```
Sandbox: bash(93866) deny(1) file-read-data /Users/sdedola/Harmony/ios/Pods/Target Support Files/Pods-HarmonyTi/expo-configure-project.sh
```

This error occurs when Xcode's User Script Sandboxing prevents Expo's configuration scripts from running during the build process.

## Why It Keeps Coming Back

1. **Pod Install**: Every time you run `pod install`, the Pods project is regenerated
2. **Expo Prebuild**: Running `npx expo prebuild` regenerates the entire iOS project
3. **Xcode Updates**: Sometimes Xcode updates reset project settings

## Permanent Solution

### 1. Podfile Configuration (Already Applied)

The `ios/Podfile` has been updated with a `post_install` hook that automatically:
- Disables User Script Sandboxing for all Pod targets
- Marks Expo scripts as "always out of date"

This fix is applied automatically every time you run `pod install`.

### 2. Main Project Fix

If you still get the error (usually from the main project, not Pods), run:

```bash
cd ios
./fix-sandbox-permanent.sh
```

This script:
- Finds your HarmonyTi.xcodeproj
- Disables User Script Sandboxing for all build configurations
- Saves the changes permanently

### 3. After Expo Prebuild

If you run `npx expo prebuild --clean`, you'll need to:

1. The Podfile changes will be preserved
2. Run `./fix-sandbox-permanent.sh` again for the main project

## Quick Checklist When Error Occurs

1. **First Time Setup**:
   ```bash
   cd ios
   pod install  # Podfile hook will fix Pods project
   ./fix-sandbox-permanent.sh  # Fix main project
   ```

2. **After Pod Install**:
   - Usually no action needed (Podfile hook handles it)
   - If error persists: `./fix-sandbox-permanent.sh`

3. **After Expo Prebuild**:
   ```bash
   cd ios
   ./fix-sandbox-permanent.sh
   ```

4. **Clean Build**:
   - In Xcode: Cmd+Shift+K (Clean Build Folder)
   - Build again: Cmd+B

## Technical Details

The error occurs because Xcode 15+ enables User Script Sandboxing by default, which prevents build scripts from accessing files outside their sandbox. Expo's configuration scripts need to read files from your project, causing the sandbox violation.

Setting `ENABLE_USER_SCRIPT_SANDBOXING = NO` allows these scripts to run properly.

## Prevention Tips

1. Keep the `fix-sandbox-permanent.sh` script in your ios directory
2. Add to your build routine after any project regeneration
3. Consider adding to your CI/CD pipeline if building on CI

## Related Files

- `ios/Podfile` - Contains automatic fix for Pods project
- `ios/fix-sandbox-permanent.sh` - Script to fix main project
- `ios/HarmonyTi.xcodeproj/project.pbxproj` - Where the setting is stored
