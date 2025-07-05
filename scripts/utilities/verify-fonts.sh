#!/usr/bin/env bash

# Verify fonts are included in iOS app bundle
set -euo pipefail

bold()  { printf "\033[1m%s\033[0m\n" "$1"; }
info()  { printf "\033[34m[INFO]\033[0m %s\n" "$1"; }
warn()  { printf "\033[33m[WARN]\033[0m %s\n" "$1"; }
success() { printf "\033[32m[SUCCESS]\033[0m %s\n" "$1"; }
error() { printf "\033[31m[ERROR]\033[0m %s\n" "$1"; }

bold "🔍 Verifying fonts in iOS build..."

# Find the most recent app bundle in DerivedData
APP_BUNDLE=$(find ~/Library/Developer/Xcode/DerivedData -name "HarmonyTi.app" -type d -mtime -1 | head -n 1)

if [[ -z "$APP_BUNDLE" ]]; then
  error "No recent HarmonyTi.app found in DerivedData"
  warn "Please build the app in Xcode first"
  exit 1
fi

info "Found app bundle: $APP_BUNDLE"

# Check for font files
FONTS_FOUND=0
for font in "Geologica-Bold.ttf" "Geologica-Light.ttf" "Geologica-Medium.ttf" "Geologica-Regular.ttf" "Geologica-SemiBold.ttf"; do
  if [[ -f "$APP_BUNDLE/$font" ]]; then
    success "✓ Found $font"
    ((FONTS_FOUND++))
  else
    error "✗ Missing $font"
  fi
done

# Check Info.plist for UIAppFonts
info "Checking Info.plist for UIAppFonts..."
if /usr/libexec/PlistBuddy -c "Print :UIAppFonts" "$APP_BUNDLE/Info.plist" 2>/dev/null; then
  success "✓ UIAppFonts array found in Info.plist"
else
  error "✗ UIAppFonts array missing from Info.plist"
fi

# Summary
echo
if [[ $FONTS_FOUND -eq 5 ]]; then
  success "All 5 Geologica fonts are present in the app bundle!"
else
  error "Only $FONTS_FOUND out of 5 fonts found in app bundle"
  warn "Run 'npx react-native-asset' to link fonts"
fi 