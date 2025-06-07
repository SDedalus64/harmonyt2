SANDBOX ERROR FIX CHEATSHEET

THE ERROR:
Sandbox: bash(93866) deny(1) file-read-data /Users/sdedola/Harmony/ios/Pods/Target Support Files/Pods-HarmonyTi/expo-configure-project.sh

QUICK FIX:
cd ios
./fix-sandbox-permanent.sh

AFTER POD INSTALL:
Usually automatic (Podfile handles it)
If error persists: ./fix-sandbox-permanent.sh

AFTER EXPO PREBUILD:
cd ios
./fix-sandbox-permanent.sh

CLEAN BUILD IN XCODE:
Cmd+Shift+K (Clean Build Folder)
Cmd+B (Build)

FIRST TIME SETUP:
cd ios
pod install
./fix-sandbox-permanent.sh

WHY IT HAPPENS:
- Xcode 15+ enables User Script Sandboxing by default
- Expo scripts need file access outside sandbox
- Gets reset on: pod install, expo prebuild, Xcode updates

PERMANENT FIXES APPLIED:
- Podfile post_install hook (automatic for Pods)
- fix-sandbox-permanent.sh script (for main project)

FILES INVOLVED:
- ios/Podfile (has automatic fix)
- ios/fix-sandbox-permanent.sh (run when needed)
- ios/HarmonyTi.xcodeproj/project.pbxproj (where setting is stored)
