# HarmonyTi Development Fixes and Additions

## Authentication & Login Features
- **Removed automatic login** - Users now required to log in every time for security
- **Added "Welcome" vs "Welcome Back"** messaging based on previous sign-in history
- **Added password visibility toggle** (eye icon) to login screen
- **Implemented local storage persistence** for beta tester accounts
- **Fixed authentication flow** to always show login screen on app startup

## UI/UX Improvements

### Splash Screen & Logo
- **Fixed blank splash screen on iPhone** - Copied splash.png to iOS image assets
- **Made logo responsive on login screen**:
  - iPad: Larger logo (600x120)
  - iPhone: Smaller logo (70% screen width x 80 height)

### Registration Screen
- **Fixed scrolling issues on iPhone** for signup form
- **Added keyboard handling properties**:
  - keyboardShouldPersistTaps="handled"
  - keyboardDismissMode="on-drag"
  - Proper KeyboardAvoidingView offset
- **Reduced excessive padding** on iPhone (from 100 to 40px bottom padding)

### HTS Code Input Enhancements
- **Updated placeholder text** to "Enter HTS Code (up to 8 digits)"
- **Limited input to 8 digits maximum**
- **Added info icon** explaining why 8 digits (HS code structure)
- **Implemented smart HTS dropdown**:
  - Shows suggestions after 3 digits
  - Uses actual tariff data
  - Displays up to 15 results with scroll
  - Shows "No matching records" when appropriate
  - Includes result count with refinement message

### Reciprocal Tariff (RT) Features
- **RT toggle only shows for eligible countries** (CN, CA, MX)
- **Toggle defaults to additive** when displayed
- **RT calculations only appear** in results for RT countries
- **Unit cost comparisons** properly show RT impact
- **First cost per unit label** changes based on RT presence
- **RT Impact Row** styled in red for visibility

### History Functionality
- **Dynamic button labels**:
  - Viewing saved: "Search" and "Clear"
  - Viewing new results: "Save & Search" and "Save & Clear"
- **Added unit calculations to history**:
  - Saves unitCount and unitCalculations
  - Properly restores unit count from history
- **Fixed navigation type imports**

### Scrolling Behavior
- **Fixed scroll to unit entry field** instead of bottom
- **Adjusted scroll position** to stop at bottom of lookup results
- **Increased scroll offset values** for better positioning

## Technical Improvements

### Build System
- **Created increment-build.js script** for automatic build number updates
- **Added npm scripts**:
  - `npm run bump` - Increment build number
  - `npm run build:ios` - Bump and build iOS
- **Updated build number to 26** (from 18)

### SDK & Dependencies
- **Upgraded to Expo SDK 53** (from SDK 50)
- **Fixed TypeScript errors** in navigation components
- **Resolved false positive linting warnings** from react-native-text-watcher

### Tariff Search Implementation
- **Created segmented tariff data system**:
  - Split large JSON into smaller files by prefix
  - Single-digit segments for small chapters
  - Two-digit segments for large chapters
- **Built TariffSearchService** with static imports for React Native
- **Fixed search to use actual data** instead of guessing codes

### Data Storage
- **Implemented local user persistence** for beta testing:
  - Registered users saved to AsyncStorage
  - Accounts persist between app sessions
  - Multiple accounts per device supported
  - Test account always available

## Bug Fixes
- **Fixed "Text string must be rendered within <Text/>"** error
- **Fixed corrupted file issues** during version display attempt
- **Fixed Metro bundler connection issues**
- **Fixed unit count not restoring** from history
- **Fixed navigation type import paths**
- **Fixed PowerShell rendering errors** in terminal

## Documentation Created
- **BACKEND_REQUIREMENTS.md** - Comprehensive backend API specifications including:
  - Authentication endpoints
  - HubSpot integration requirements
  - Session report generation
  - Commodity-specific guides
  - Future feature stubs
  - Infrastructure requirements
  - Security specifications
  - Development phases

## Development Workflow Improvements
- **Automated build numbering** to prevent App Store conflicts
- **Fresh prebuild process** documented
- **Clear commands for development**:
  - `npx expo prebuild --clean`
  - `npx expo run:ios`
  - `npx expo start`

## Beta Testing Preparation
- **Local account creation** enabled
- **Persistent user storage** implemented
- **Mock authentication** with clear test credentials
- **Welcome messaging** for returning users
- **Proper error handling** for invalid credentials

## Performance Optimizations
- **Segmented tariff data loading** for faster searches
- **Static imports** for React Native compatibility
- **Efficient scroll positioning** calculations
- **Optimized dropdown rendering** with result limits

This session successfully transformed the app from development state to beta-ready with proper authentication, improved UX, and comprehensive backend planning!
