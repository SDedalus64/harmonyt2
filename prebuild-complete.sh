THIS SHOULD BE A LINTER ERROR#!/usr/bin/env bash

# prebuild-complete.sh – Automates the entire pre-build sequence documented in
# docs/build-guides/PREBUILD_INSTRUCTIONS.md
#
# Usage:  chmod +x prebuild-complete.sh  &&  ./prebuild-complete.sh
# -----------------------------------------------------------------------------
set -euo pipefail

bold() { printf "\033[1m%s\033[0m\n" "$1"; }
info() { printf "\033[34m[INFO]\033[0m %s\n" "$1"; }
warn() { printf "\033[33m[WARN]\033[0m %s\n" "$1"; }

bold "🚀 Starting complete pre-build process …"

git_status=$(git status --porcelain)
if [[ -n $git_status ]]; then
  warn "Uncommitted changes detected. It's recommended to commit or stash before continuing."
fi

################################################################################
# 1. Ensure Xcode is closed (macOS only)
################################################################################
if [[ "$OSTYPE" == "darwin"* ]]; then
  if pgrep -xq "Xcode"; then
    warn "Xcode appears to be running. Please close it to avoid file-lock issues."
    read -p "Continue anyway? [y/N] " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      info "Aborting pre-build."; exit 1; fi
  fi
fi

################################################################################
# 2. Clean existing native directories & caches
################################################################################
info "Removing existing ios/ and android/ directories …"
rm -rf ios android || true

info "Clearing Xcode DerivedData & Metro caches …"
rm -rf ~/Library/Developer/Xcode/DerivedData || true
rm -rf "$TMPDIR"/metro-* "$TMPDIR"/haste-* "$TMPDIR"/react-* 2>/dev/null || true

################################################################################
# 3. expo prebuild (fresh native projects)
################################################################################
info "Running \"expo prebuild --clean\" … this may take a few minutes."

npx expo prebuild --clean

################################################################################
# 4. Restore tracked Podfile (expo prebuild may overwrite it)
################################################################################
if [[ -f ios/Podfile ]]; then
  info "Restoring tracked Podfile …"
  git checkout -- ios/Podfile || true
fi

################################################################################
# 5. CocoaPods install
################################################################################
info "Installing pods …"
( cd ios && pod install --repo-update )

################################################################################
# 6. Run fix-xcode-warnings.sh (critical)
################################################################################
info "Running fix-xcode-warnings.sh …"
chmod +x fix-xcode-warnings.sh
./fix-xcode-warnings.sh

################################################################################
# 7. Fix sandbox script permissions
################################################################################
SANDBOX_SCRIPT="ios/Pods/Target Support Files/Pods-HarmonyTi/expo-configure-project.sh"
if [[ -f "$SANDBOX_SCRIPT" ]]; then
  chmod +x "$SANDBOX_SCRIPT"
fi

################################################################################
# Done
################################################################################
bold "✅ Pre-build complete!"
info "Open ios/HarmonyTi.xcworkspace in Xcode and follow remaining build steps (select team, clean build folder, archive)."