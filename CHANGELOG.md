# Changelog

All notable changes to HarmonyTi will be documented in this file.
feat: integrate Geologica font family and update typography across the app

refactor: remove Android and iOS project files, update component styles and structure
refactor: enhance LookupScreen with type annotations and layout improvements

[2025-07-07]

refactor: enhance LookupScreen with type annotations and layout improvements

- Added TypeScript type annotations for better type safety in UIManager.measure and various functions.
- Improved the layout of the LookupScreen by implementing a fixed header and inline results display.
- Updated the handling of additional costs and unit counts to ensure proper type usage and clarity.
- Adjusted styles for the results section to enhance user experience and readability.

[2025-07-06]

- Upgraded expo from version 52.0.6 to 53.0.17 in package.json for improved features and performance.
- Regenerated yarn.lock to reflect the updated dependencies and ensure compatibility.
- chore: update expo version in package.json and refresh yarn.lock

  \- Upgraded expo from version 52.0.6 to 53.0.17 in package.json for improved features and performance.

  \- Regenerated yarn.lock to reflect the updated dependencies and ensure compatibility.

- Deleted Android project files including build configurations, resources, and Gradle settings.
- Removed iOS project files including AppDelegate, Info.plist, and other related resources.
- Updated CountryLookup, DiagonalSection, and other components for improved styling and layout.
- Adjusted button and input styles for better consistency across the application.
- Enhanced the SaveWorkCard and SessionExportModal components for improved user experience.

[2025-07-05]

- Added Geologica font files (Bold, Light, Medium, Regular, SemiBold) to the project assets.
- Updated Info.plist to include new font resources for proper rendering.
- Enhanced typography across various components to utilize Geologica fonts for improved consistency and readability.
- Introduced a new HorizontalSection component for better layout management.
- Adjusted styles in multiple screens and components to accommodate the new font sizes and improve user experience.
- Implemented a verification script to ensure fonts are correctly included in the iOS app bundle.

[2025-07-04]

Changed

- Updated all fonts to use Geologica font family
- Modified BRAND_TYPOGRAPHY configuration to use Geologica as primary and secondary font
- Added getFontFamily helper function to handle font weights properly
- Created react-native.config.js for font asset configuration

  Added

- Created GEOLOGICA_FONT_IMPLEMENTATION.md guide with detailed instructions for adding Geologica font files
- Added font weight mapping for Geologica font variants (Light, Regular, Medium, SemiBold, Bold)

  Note

- Font files need to be downloaded and added to assets/fonts/ directory
- Native configurations (iOS and Android) need to be updated after adding font files

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

[Unreleased]

Added

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

  Changed

<!-- Changes in existing functionality -->

feat: implement Geologica font integration across components (2025-07-04)

- Added a new configuration file for React Native to manage font assets.
- Introduced a CustomText component to standardize text rendering with Geologica fonts.
- Updated existing components (CountryLookup, LoginScreen, ProfileScreen, SettingsScreen) to utilize the new typography styles.
- Removed the deprecated CountrySelectionScreen to streamline navigation.
- Enhanced text styles for consistency and improved readability across the application.
- Fixed Android font rendering by updating all screens to use custom Text component instead of React Native's default Text.
- Moved Default Country setting to first position in Preferences for better dropdown expansion room.

fix: update placeholder text in LookupScreen for clarity

- Changed the placeholder text from "Est. Other Costs" to "Est. Other Costs (Optional)" to better indicate that the field is not mandatory.
- Updated InfoDrawer content for clarity, including revised titles and descriptions for declared value and import costs.
  (2025-07-04)

- Changed text on Settings screen - Show Quick Tour

  Deprecated

<!-- Soon-to-be removed features -->

Removed

<!-- Now removed features -->

Fixed

<!-- Bug fixes -->

- Added field-specific fallback positions when measurement fails to ensure proper tab alignment.
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
  - Switched to UIManager.measure for Android to resolve measureInWindow returning undefined
  - Added field-specific fallback positions when measurement fails
  - Increased delay to 300ms for more reliable Android layout measurements
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

  Security

<!-- Vulnerability fixes -->

Performance

<!-- Performance improvements -->

To Do

- Automated tariff data update pipeline
- Backend API implementation for authentication
- HubSpot integration for user tracking
- Session report generation
- Commodity-specific guides

  [2.5.0] - 2025-06-25

Added

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

Changed

- Brand color theming throughout the app:
  - Placeholder text now uses electricBlue ( 0099FF)
  - Input values display in darkNavy ( 0A1A3E)
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

  Fixed

- SettingsProvider context error resolved
- USMCA origin calculation logic corrected
- Blank splash screen on iPhone
- Registration screen scrolling issues on iPhone
- "Text string must be rendered within Text/" error
- Metro bundler connection issues
- Unit count not restoring from history
- Navigation type import paths
- PowerShell rendering errors in terminal
- Parallel initialization preventing startup blocks
- Context hook errors with proper provider wrapping

  Removed

- "Make Reciprocal Tariffs Additive" toggle (now always additive)
- Automatic login feature (now requires login each time)
- Excessive padding on iPhone registration screen

  Performance

- Implemented segmented tariff data system for faster searches
- Parallel initialization of tariffSearchService and TariffService
- Static imports optimized for React Native compatibility
- Efficient scroll positioning calculations
- Optimized dropdown rendering with 15-result limit

[2.4.0] - 2025-06-19

Added

- Authentication flow with login required on startup
- Build system improvements with automatic versioning
- Segmented tariff search implementation
- Local user persistence for beta testing
- Mock authentication with test credentials

  Changed

- Build number updated to 26 (from 18)
- Fresh prebuild process documented

[2.3.0] - 2025-06-03

Added

- Initial beta release preparation
- Core duty calculation features
- History tracking functionality
- Country selection with defaults
- Unit cost calculations

---

Version Guidelines

When making changes:

1. Add new entries under `[Unreleased]` section
2. Use these categories: Added, Changed, Deprecated, Removed, Fixed, Security
3. When releasing, move `[Unreleased]` items to a new version section with date
4. Follow semantic versioning: MAJOR.MINOR.PATCH

Examples

- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` in case of vulnerabilities

feat: integrate Geologica font family and update typography across the app

- Added Geologica font files (Bold, Light, Medium, Regular, SemiBold) to the project assets.
- Updated Info.plist to include new font resources for proper rendering.
- Enhanced typography across various components to utilize Geologica fonts for improved consistency and readability.
- Introduced a new HorizontalSection component for better layout management.
- Adjusted styles in multiple screens and components to accommodate the new font sizes and improve user experience.
- Implemented a verification script to ensure fonts are correctly included in the iOS app bundle.

## [2025-07-05]

Added

- Enhanced Tariff Engineering feature with real duty rate comparisons
  - Shows current vs suggested duty rates with savings calculations
  - Finds neighboring HTS codes with lower rates (e.g., 42021100 → 42021260 saves 14.3%)
  - Identifies material alternatives that could reduce duties
  - Displays "Save X%" badges for each suggestion
  - Categories: Top Savings, Neighboring Classifications, Material Alternatives
- Generated comprehensive tariff engineering database (4.8MB) with 2,231 consumer goods entries
- New `tariffEngineeringService.ts` that provides actionable duty savings opportunities
- Scripts to analyze tariff data and find classification pivot points

Changed

- Tariff Engineering screen now shows actual duty rate differences instead of similarity scores
- Improved UI with duty rate arrows (20% → 5.7%) and savings badges
- Search button text changed to "Find Lower Duty Rates" for clarity
- Empty state message when no lower-duty alternatives exist

Fixed

- HTS dropdown now properly displays search results in Tariff Engineering screen
- Semantic link service imports corrected to use generated data files

## [2025-07-04]

Changed

- Updated all fonts to use Geologica font family
- Modified BRAND_TYPOGRAPHY configuration to use Geologica as primary and secondary font
- Added getFontFamily helper function to handle font weights properly
- Created react-native.config.js for font asset configuration

Added

- Created GEOLOGICA_FONT_IMPLEMENTATION.md guide with detailed instructions for adding Geologica font files
- Added font weight mapping for Geologica font variants (Light, Regular, Medium, SemiBold, Bold)

Note

- Font files need to be downloaded and added to assets/fonts/ directory
- Native configurations (iOS and Android) need to be updated after adding font files

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Added

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

Changed

<!-- Changes in existing functionality -->

feat: implement Geologica font integration across components (2025-07-04)

- Added a new configuration file for React Native to manage font assets.
- Introduced a CustomText component to standardize text rendering with Geologica fonts.
- Updated existing components (CountryLookup, LoginScreen, ProfileScreen, SettingsScreen) to utilize the new typography styles.
- Removed the deprecated CountrySelectionScreen to streamline navigation.
- Enhanced text styles for consistency and improved readability across the application.
- Fixed Android font rendering by updating all screens to use custom Text component instead of React Native's default Text.
- Moved Default Country setting to first position in Preferences for better dropdown expansion room.

fix: update placeholder text in LookupScreen for clarity

- Changed the placeholder text from "Est. Other Costs" to "Est. Other Costs (Optional)" to better indicate that the field is not mandatory.
- Updated InfoDrawer content for clarity, including revised titles and descriptions for declared value and import costs.
  (2025-07-04)

- Changed text on Settings screen - Show Quick Tour

Deprecated

<!-- Soon-to-be removed features -->

Removed

<!-- Now removed features -->

Fixed

<!-- Bug fixes -->

- Added field-specific fallback positions when measurement fails to ensure proper tab alignment.
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
  - Switched to UIManager.measure for Android to resolve measureInWindow returning undefined
  - Added field-specific fallback positions when measurement fails
  - Increased delay to 300ms for more reliable Android layout measurements
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

Security

<!-- Vulnerability fixes -->

Performance

<!-- Performance improvements -->

To Do

- Automated tariff data update pipeline
- Backend API implementation for authentication
- HubSpot integration for user tracking
- Session report generation
- Commodity-specific guides

## [2.5.0] - 2025-06-25

Added

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

Changed

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

Fixed

- SettingsProvider context error resolved
- USMCA origin calculation logic corrected
- Blank splash screen on iPhone
- Registration screen scrolling issues on iPhone
- "Text string must be rendered within Text" error
- Metro bundler connection issues
- Unit count not restoring from history
- Navigation type import paths
- PowerShell rendering errors in terminal
- Parallel initialization preventing startup blocks
- Context hook errors with proper provider wrapping

Removed

- "Make Reciprocal Tariffs Additive" toggle (now always additive)
- Automatic login feature (now requires login each time)
- Excessive padding on iPhone registration screen

Performance

- Implemented segmented tariff data system for faster searches
- Parallel initialization of tariffSearchService and TariffService
- Static imports optimized for React Native compatibility
- Efficient scroll positioning calculations
- Optimized dropdown rendering with 15-result limit

## [2.4.0] - 2025-06-19

Added

- Authentication flow with login required on startup
- Build system improvements with automatic versioning
- Segmented tariff search implementation
- Local user persistence for beta testing
- Mock authentication with test credentials

Changed

- Build number updated to 26 (from 18)
- Fresh prebuild process documented

## [2.3.0] - 2025-06-03

Added

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
