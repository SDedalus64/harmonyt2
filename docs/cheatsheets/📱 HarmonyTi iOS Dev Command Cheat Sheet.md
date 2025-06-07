📱 HarmonyTi iOS Dev Command Cheat Sheet



Initial Setup (After Clone or Pull)

```bash
npm install               # Install JS dependencies
cd ios && pod install     # Install iOS pods
cd ..                     # Back to root
```



------



JavaScript Dev (Metro Bundler)

```
npm start                 # Start Metro (keep running while developing)
```



------



Native iOS Dev (Storyboard, Swift, etc.)

```
cd ios
xcodebuild clean          # Clean build cache (optional but safe)
open HarmonyTi.xcworkspace
```

> Then build/run from Xcode.



------



Run in Simulator via CLI

```
npx react-native run-ios
```

Or boot manually:

```
xcrun simctl list                     # See available devices
xcrun simctl boot "iPhone 15"        # Boot specific simulator
```



------



Launch Simulator Manually

```
open -a Simulator
```



------



Link Native Modules / Assets

```
npx react-native link                # Only for manually linked packages
cd ios && pod install                # Always run after linking native code
```



------



Build & Archive (for TestFlight)

1. Open HarmonyTi.xcworkspace in Xcode.
2. Select Generic iOS Device (top bar).
3. Go to Product > Archive.
4. Distribute via Organizer.



------



Fixes & Cleanup

```
watchman watch-del-all              # Reset file watches
rm -rf node_modules && npm install  # Reinstall JS deps
cd ios && pod deintegrate && pod install
```



------



Sandbox Error Fix

Error: `Sandbox: bash deny(1) file-read-data .../expo-configure-project.sh`

Quick Fix:
```
cd ios
./fix-sandbox-permanent.sh          # Disables sandboxing for build scripts
```

When to Run:
- After `npx expo prebuild --clean`
- If sandbox error appears after pod install
- After Xcode updates

Then in Xcode:
- Cmd+Shift+K (Clean Build)
- Cmd+B (Build)



------



Keep These Running During Dev

- npm start → Metro Bundler
- Simulator → Launch manually or via CLI



------

```
Want this exported to a `.md` file or converted into a PDF or printed reference card?
```
