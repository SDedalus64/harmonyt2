# Changelog

All notable changes to HarmonyTi will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

<!-- New features -->

- Settings drawer functionality for Show Unit Calculations - controls visibility of unit count input and calculations in results (2025-06-30)
- Haptic feedback implementation throughout the app: (2025-06-30)
  - Light impact for button presses
  - Medium impact for calculate action
  - Heavy impact for destructive actions (Clear button)
  - Success/error/warning patterns for various states
  - Selection feedback for toggles and list items
  - Different haptic types: light, medium, heavy, success, error, warning, selection
  - Smart caching to avoid performance impact
  - expo-haptics package integration

### Changed

<!-- Changes in existing functionality -->

Changed text on Settings screen - Show Quick Tour

### Deprecated

<!-- Soon-to-be removed features -->

### Removed

<!-- Now removed features -->

### Fixed

<!-- Bug fixes -->

- Android build issues with Expo SDK 52 compatibility (2025-07-03)
  - Excluded problematic `expo-system-ui` module from Android builds
  - Fixed signing configuration to use debug keystore when release credentials not configured
  - Resolved `expo-module-gradle-plugin` not found error
  - Fixed `components.release` not found error in expo-modules-core
- Android-specific NaN error in info tab positioning (2025-07-03)
  - Added delay for Android layout measurement to ensure components are fully rendered
  - Added validation checks for measurement values to prevent NaN
  - Added fallback position when measurement fails
  - Fixed animation initial values for FAB menu components
  - Prevented info tab from rendering until valid position is calculated
- Android info drawer tab alignment issues (2025-07-03)
  - Fixed tab positioning by properly accounting for status bar height using safe area insets
  - Increased measurement delay to 200ms on Android for more reliable layout calculations
  - Added debug logging to track measurement values and positioning calculations
  - Unified measurement approach using measureInWindow for both platforms
- Prebuild script improvements (2025-07-03)
  - Modified script to backup and restore critical Android configuration files
  - Preserves custom Android fixes (expo-system-ui exclusion) across prebuilds
  - Prevents need to manually reapply Android fixes after each prebuild
  - Successfully builds both iOS and Android platforms
- Git pre-commit hook improvements (2025-07-03)
  - Enhanced error messages to detect when CHANGELOG.md is modified but not staged
  - Shows clear actionable command: `git add CHANGELOG.md`
  - Better developer experience with specific guidance for different scenarios
- "Show Unit Calculations" setting now properly controls visibility (2025-06-30)
  - Unit Count field only appears when setting is enabled
  - Results respect the user's display preference
  - Setting syncs with local state changes
  - History items preserve unit calculation display state

### Security

<!-- Vulnerability fixes -->

### Performance

<!-- Performance improvements -->

### To Do

- Automated tariff data update pipeline
- Backend API implementation for authentication
- HubSpot integration for user tracking
- Session report generation
- Commodity-specific guides

## [2.5.0] - 2025-06-25

### Added

- Tariff Data Revision 14 with new global rates
- USMCA Origin Certificate toggle for Canada/Mexico imports
- Automatic reciprocal tariff exemption detection
- Extended exemptions for:
  - Pharmaceuticals (Chapter 30) from China
  - Medical devices (HS 9018-9022) from China
  - Energy products (Chapter 27) from Canada and Mexico
- Version-controlled tariff data with datestamped JSON files
- Detailed instrumentation and timing logs for performance monitoring
- "None" option for default country selection in Settings
- Info icons with explanations for input fields
- Welcome vs Welcome Back messaging based on login history
- Password visibility toggle on login screen
- Local storage persistence for beta tester accounts
- Smart HTS code dropdown with real tariff data suggestions
- Reciprocal Tariff (RT) toggle for eligible countries (CN, CA, MX)
- Unit cost calculations with RT impact visualization
- Automated build number increment script
- Comprehensive backend requirements documentation

### Changed

- Brand color theming throughout the app:
  - Placeholder text now uses electricBlue (#0099FF)
  - Input values display in darkNavy (#0A1A3E)
  - Country names highlighted in electricBlue in results
- Default global tariff rate updated to 50%
- UK special rate remains at 25% with clear labeling
- Section 232 Steel entries now display "50%, UK 25%" side by side
- Reciprocal tariffs now always stack additively (no toggle needed)
- Upgraded to Expo SDK 53 (from SDK 50)
- Improved responsive logo sizing on login screen
- HTS code input limited to 8 digits maximum
- Search service timeout reduced to 5 seconds
- History button labels now dynamic based on context
- Improved scroll positioning for unit entry field

### Fixed

- SettingsProvider context error resolved
- USMCA origin calculation logic corrected
- Blank splash screen on iPhone
- Registration screen scrolling issues on iPhone
- "Text string must be rendered within <Text/>" error
- Metro bundler connection issues
- Unit count not restoring from history
- Navigation type import paths
- PowerShell rendering errors in terminal
- Parallel initialization preventing startup blocks
- Context hook errors with proper provider wrapping

### Removed

- "Make Reciprocal Tariffs Additive" toggle (now always additive)
- Automatic login feature (now requires login each time)
- Excessive padding on iPhone registration screen

### Performance

- Implemented segmented tariff data system for faster searches
- Parallel initialization of tariffSearchService and TariffService
- Static imports optimized for React Native compatibility
- Efficient scroll positioning calculations
- Optimized dropdown rendering with 15-result limit

## [2.4.0] - 2025-06-19

### Added

- Authentication flow with login required on startup
- Build system improvements with automatic versioning
- Segmented tariff search implementation
- Local user persistence for beta testing
- Mock authentication with test credentials

### Changed

- Build number updated to 26 (from 18)
- Fresh prebuild process documented

## [2.3.0] - 2025-06-03

### Added

- Initial beta release preparation
- Core duty calculation features
- History tracking functionality
- Country selection with defaults
- Unit cost calculations

---

## Version Guidelines

When making changes:

1. Add new entries under `[Unreleased]` section
2. Use these categories: Added, Changed, Deprecated, Removed, Fixed, Security
3. When releasing, move `[Unreleased]` items to a new version section with date
4. Follow semantic versioning: MAJOR.MINOR.PATCH

## Examples

- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` in case of vulnerabilities
