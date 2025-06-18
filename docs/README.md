# HarmonyTi Documentation

This folder contains all project documentation organized by category.

## 📁 Structure

### `/build-guides`
Current build and deployment documentation:
- **PREBUILD_INSTRUCTIONS.md** - Step-by-step prebuild process (includes critical fix script!)
- **BETA_BUILD_GUIDE.md** - Guide for creating beta builds
- **XCODE_BUILD_CHECKLIST.md** - Xcode build checklist

### `/development`
Development documentation and requirements:
- **BACKEND_REQUIREMENTS.md** - Comprehensive backend API specifications
- **SESSION_ACCOMPLISHMENTS.md** - Features and fixes from recent development session
- **BETA_TEST_CHECKLIST.md** - Checklist for beta testing preparation

### `/cheatsheets`
Quick reference guides:
- **📱 HarmonyTi iOS Dev Command Cheat Sheet.md** - Common development commands
- **CLEAN_COMMANDS.md** - Cleanup and troubleshooting commands

### `/archive`
Obsolete or historical documentation (kept for reference):
- Old sandbox error fixes (resolved by fix-xcode-warnings.sh)
- Previous cleanup plans (completed)
- Migration guides (no longer needed)
- Old Xcode guides (superseded by current documentation)

## 🚀 Quick Start

For new developers, start with:
1. `/build-guides/PREBUILD_INSTRUCTIONS.md` - How to build the project
2. `/development/BACKEND_REQUIREMENTS.md` - Understanding the API needs
3. `/cheatsheets/` - Quick command references

## 📝 Note

Always refer to documentation in `/build-guides` and `/development` for current information.
Files in `/archive` are kept for historical reference only.

## ✅ Commit Messages

Keep commit messages short and descriptive. The first line should summarize what changed using an imperative tone.

Good:
- "Remove unused TypeScript preset"
- "Update README introduction"

Avoid vague messages like "Applying previous commit". See `COMMIT_MESSAGES.md` for details.
