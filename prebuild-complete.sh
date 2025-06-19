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