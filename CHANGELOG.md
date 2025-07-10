# Changelog

All notable changes to HarmonyTi will be documented in this file.

## [Unreleased]

feat: initialize Android and iOS project structure with Expo and React Native

- Added Android project files including .gitignore, build.gradle, gradle.properties, and various resource files to set up the Android environment.
- Introduced iOS project files such as Podfile, Info.plist, and AppDelegate.swift to establish the iOS structure.
- Configured initial settings for Expo and React Native integration, ensuring a streamlined development experience.
- Included necessary assets and resources for both platforms to support application functionality.
  Added
  feat: add new components and enhance existing ones for improved UI and functionality

- Introduced new components including HtsDropdown, TariffEngineeringComparison, and various shared components.
- Updated LookupScreen and other screens for better layout and design consistency.
- Added utility functions for improved data handling and UI interactions.
- Enhanced existing services and configurations for better performance and maintainability.
- Included new test cases to ensure functionality and reliability of the new features.

### Changed

- Upgraded expo dependency from version 53.0.0 to 53.0.18 for improved performance and compatibility (2025-07-06)
- Removed unused imports and simplified type definitions in LookupScreen for better code clarity (2025-07-06)
- Implemented Geologica font integration across components (2025-07-04):
  - Added a new configuration file for React Native to manage font assets
  - Introduced a CustomText component to standardize text rendering with Geologica fonts
  - Updated existing components (CountryLookup, LoginScreen, ProfileScreen, SettingsScreen) to utilize the new typography styles
  - Removed the deprecated CountrySelectionScreen to streamline navigation
  - Enhanced text styles for consistency and improved readability across the application
  - Fixed Android font rendering by updating all screens to use custom Text component instead of React Native's default Text
  - Moved Default Country setting to first position in Preferences for better dropdown expansion room
- Updated placeholder text in LookupScreen for clarity (2025-07-04):
  - Changed placeholder text from "Est. Other Costs" to "Est. Other Costs (Optional)"
  - Updated InfoDrawer content with revised titles and descriptions
  - Changed text on Settings screen - Show Quick Tour

### Fixed

- Added field-specific fallback positions when measurement fails to ensure proper tab alignment
- Android build issues with Expo SDK 52 compatibility (2025-07-03):
  - Excluded problematic `expo-system-ui` module from Android builds
  - Fixed signing configuration to use debug keystore when release credentials not configured
  - Resolved `expo-module-gradle-plugin` not found error
  - Fixed `components.release` not found error in expo-modules-core
- Android-specific NaN error in info tab positioning (2025-07-03):
  - Added delay for Android layout measurement to ensure components are fully rendered
  - Added validation checks for measurement values to prevent NaN
  - Added fallback position when measurement fails
  - Fixed animation initial values for FAB menu components
  - Prevented info tab from rendering until valid position is calculated
- Android info drawer tab alignment issues (2025-07-03):
  - Fixed tab positioning by properly accounting for status bar height using safe area insets
  - Increased measurement delay to 200ms on Android for more reliable layout calculations
  - Added debug logging to track measurement values and positioning calculations
  - Unified measurement approach using measureInWindow for both platforms
  - Switched to UIManager.measure for Android to resolve measureInWindow returning undefined
  - Added field-specific fallback positions when measurement fails
  - Increased delay to 300ms for more reliable Android layout measurements
- Prebuild script improvements (2025-07-03):
  - Modified script to backup and restore critical Android configuration files
  - Preserves custom Android fixes (expo-system-ui exclusion) across prebuilds
  - Prevents need to manually reapply Android fixes after each prebuild
  - Successfully builds both iOS and Android platforms
- Git pre-commit hook improvements (2025-07-03):
  - Enhanced error messages to detect when CHANGELOG.md is modified but not staged
  - Shows clear actionable command: `git add CHANGELOG.md`
  - Better developer experience with specific guidance for different scenarios
- "Show Unit Calculations" setting now properly controls visibility (2025-06-30):
  - Unit Count field only appears when setting is enabled
  - Results respect the user's display preference
  - Setting syncs with local state changes
  - History items preserve unit calculation display state

### To Do

- Automated tariff data update pipeline
- Backend API implementation for authentication
- HubSpot integration for user tracking
- Session report generation
- Commodity-specific guides

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
