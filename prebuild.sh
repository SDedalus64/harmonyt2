#!/bin/bash

################################################################################
# HarmonyTi Prebuild Automation Script
# ------------------------------------
# Executes all steps required for a clean Expo prebuild, in the correct order.
# This script is intended for macOS environments.
#
# Usage:
#   chmod +x prebuild.sh   # (Run once to make executable)
#   ./prebuild.sh          # Start full prebuild
################################################################################

set -e  # Exit immediately on any error
set -o pipefail

#--------------------------------------
# Helper Functions
#--------------------------------------
error_exit() {
  echo "❌  $1" >&2
  exit 1
}

info() {
  printf "\n👉  %s\n\n" "$1"
}

#--------------------------------------
# 0. Verify project root
#--------------------------------------
[ -f "package.json" ] || error_exit "Run this script from the project root (where package.json resides)."

#--------------------------------------
# 1. Close Xcode if running
#--------------------------------------
info "Closing Xcode (if running)..."
if pgrep -x "Xcode" >/dev/null; then
  osascript -e 'tell application "Xcode" to quit' || true
  # Wait until Xcode stops
  while pgrep -x "Xcode" >/dev/null; do sleep 1; done
fi

#--------------------------------------
# 2. Clean previous native builds & caches
#--------------------------------------
info "Cleaning previous native projects (ios / android) and caches..."
rm -rf ios android
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf "$TMPDIR"/metro-*
rm -rf "$TMPDIR"/haste-*
rm -rf "$TMPDIR"/react-*

#--------------------------------------
# 3. Run Expo prebuild
#--------------------------------------
info "Running 'expo prebuild --clean'... (this may take several minutes)"
# Ensure Expo CLI is available
if ! command -v expo >/dev/null 2>&1; then
  npx expo prebuild --clean || error_exit "Expo CLI failed. Ensure you have expo installed."
else
  expo prebuild --clean || error_exit "Expo prebuild failed."
fi

#--------------------------------------
# 4. Restore tracked Podfile & install pods
#--------------------------------------
info "Restoring tracked Podfile and installing pods..."
# If using git and Podfile exists in history, restore to avoid Expo overwrites
if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git checkout -- ios/Podfile || true
fi

cd ios || error_exit "iOS directory not found after prebuild."

echo "Installing CocoaPods..."
pod install --repo-update
cd ..

#--------------------------------------
# 5. Run fix-xcode-warnings script
#--------------------------------------
info "Running fix-xcode-warnings.sh..."
chmod +x fix-xcode-warnings.sh
./fix-xcode-warnings.sh

#--------------------------------------
# 6. Fix sandbox / permissions issues
#--------------------------------------
info "Fixing sandbox permissions for expo-configure-project.sh..."
chmod +x "ios/Pods/Target Support Files/Pods-HarmonyTi/expo-configure-project.sh" || true

#--------------------------------------
# 7. Done
#--------------------------------------
info "✅ Prebuild complete!"
echo "Next steps:"
echo "1. Open 'ios/HarmonyTi.xcworkspace' in Xcode"
echo "2. Select your development team in Signing & Capabilities"
echo "3. Clean build folder (Product → Clean Build Folder)"
echo "4. Build and run for testing, or Archive for distribution"
echo ""
echo "💡 To start the development server after building:"
echo "   ./start-dev.sh" 