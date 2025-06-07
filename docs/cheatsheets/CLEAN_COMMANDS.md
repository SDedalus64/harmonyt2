HarmonyTi iOS Dev Commands

Initial Setup:
npm install
cd ios && pod install
cd ..

Start Metro:
npm start

Native iOS Dev:
cd ios
xcodebuild clean
open HarmonyTi.xcworkspace

Run in Simulator:
npx react-native run-ios

Boot Simulator Manually:
xcrun simctl list
xcrun simctl boot "iPhone 15"

Launch Simulator:
open -a Simulator

Link Native Modules:
npx react-native link
cd ios && pod install

Fixes & Cleanup:
watchman watch-del-all
rm -rf node_modules && npm install
cd ios && pod deintegrate && pod install

Sandbox Error Fix:
cd ios
./fix-sandbox-permanent.sh

Clean Build in Xcode:
Cmd+Shift+K
Cmd+B
