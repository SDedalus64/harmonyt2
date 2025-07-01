#!/usr/bin/env bash

# -----------------------------------------------------------------------------
#  ios_prebuild.sh
# -----------------------------------------------------------------------------
# Automates the full iOS pre-build workflow defined in docs/build-guides/PREBUILD_INSTRUCTIONS.md.
# Run from project root:
#   chmod +x scripts/setup/ios_prebuild.sh
#   ./scripts/setup/ios_prebuild.sh
# -----------------------------------------------------------------------------
set -euo pipefail

bold() { printf "\033[1m%s\033[0m\n" "$1"; }
info() { printf "\033[34m[INFO]\033[0m %s\n" "$1"; }
warn() { printf "\033[33m[WARN]\033[0m %s\n" "$1"; }

bold "🚀  Starting complete pre-build process …"

# Warn when there are uncommitted changes
if [[ -n $(git status --porcelain || true) ]]; then
  warn "Uncommitted changes detected. Consider committing or stashing before continuing."
fi

###############################################################################
# 1. Ensure Xcode is closed (macOS only)
###############################################################################
if [[ "$OSTYPE" == "darwin"* ]]; then
  if pgrep -xq "Xcode"; then
    warn "Xcode appears to be running. Please close it first to avoid file-lock issues."
    read -rp "Continue anyway? [y/N] " confirm
    [[ $confirm =~ ^[Yy]$ ]] || { info "Aborting."; exit 1; }
  fi
fi

###############################################################################
# 2. Clean native directories and caches
###############################################################################
info "Removing ios/ and android/ directories …"
rm -rf ios android || true

info "Clearing DerivedData and Metro caches …"
rm -rf ~/Library/Developer/Xcode/DerivedData || true
rm -rf "${TMPDIR:-/tmp}"/metro-* "${TMPDIR:-/tmp}"/haste-* "${TMPDIR:-/tmp}"/react-* 2>/dev/null || true

###############################################################################
# 3. Expo prebuild
###############################################################################
info "Running expo prebuild --clean (this may take a while) …"
npx expo prebuild --clean

###############################################################################
# 4. Restore tracked Podfile (prebuild can overwrite it)
###############################################################################
if [[ -f ios/Podfile ]]; then
  info "Restoring tracked Podfile …"
  git checkout -- ios/Podfile || true
fi

###############################################################################
# 5. Install pods
###############################################################################
info "Installing CocoaPods dependencies …"
( cd ios && pod install --repo-update )

###############################################################################
# 6. Run warnings-fix script (critical)
###############################################################################
info "Running fix-xcode-warnings.sh …"
chmod +x scripts/utilities/fix-xcode-warnings.sh
./scripts/utilities/fix-xcode-warnings.sh

###############################################################################
# 7. Fix sandbox script permissions
###############################################################################
SANDBOX_SCRIPT="ios/Pods/Target Support Files/Pods-HarmonyTi/expo-configure-project.sh"
if [[ -f "$SANDBOX_SCRIPT" ]]; then
  chmod +x "$SANDBOX_SCRIPT"
fi

bold "✅  Pre-build complete!"
info "Open ios/HarmonyTi.xcworkspace in Xcode, select your team, clean build folder, then archive."