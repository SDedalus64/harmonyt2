# HarmonyTi - Comprehensive Feature Listing

This document provides a complete listing of all features and functionality in the HarmonyTi app, including many not mentioned in the README.

## 🎯 Core Calculation Features

### Tariff Calculations

- **MFN (Most Favored Nation) rates** - Base duty rates
- **Section 301 tariffs** - China-specific trade action tariffs (Lists 1-4A)
- **Section 232 tariffs** - Steel/Aluminum tariffs (50% global, 25% UK)
- **Section 201 tariffs** ⚠️ - Solar product tariffs (14.25%)
- **Reciprocal tariffs** - Country-specific retaliatory tariffs
- **IEEPA tariffs** - Canada/Mexico tariffs with exemptions
- **Fentanyl tariffs** - Special China tariffs
- **Column 2 rates** - For non-NTR countries (Cuba, North Korea)
- **Trade action tariffs** - Special higher rates for Russia/Belarus

### Calculation Features

- **USMCA Origin Certificate toggle** - Duty-free for qualified CA/MX goods
- **Additive tariff stacking** - All applicable tariffs add together
- **Per-unit cost calculations** - Shows cost per unit with/without RT
- **Landed cost calculations** - Total cost including freight and duties
- **Duty comparison analysis** - Compare scenarios with/without reciprocal tariffs
- **Processing fees** - MPF (0.3464%) and HMF (0.125%) automatically calculated

## 📱 User Interface Features

### Main Lookup Screen

- **Smart HTS code search** - Real-time suggestions after 3 digits
- **Country selection** - 50+ countries with flags
- **Optional freight cost input** - For landed cost calculations
- **Optional unit count input** - For per-unit calculations
- **Field info system** - (i) icons with detailed explanations
- **Responsive design** - Optimized for iPhone and iPad

### Floating Action Button (FAB) Menu

- **Main FAB** - Expands to show 6 menu options in diagonal layout
- **Recent FAB** (Blue) - Quick access to last 10 lookups
- **History FAB** (Medium Blue) - Full history with search
- **Tariff News FAB** (Green) - Trade news and updates
- **DGL Blog FAB** (Orange) - Industry news and insights
- **Analytics FAB** (Info Blue) - Trade statistics dashboard
- **Settings FAB** (Gray) - User preferences and account

### Drawer System

All drawers feature:

- Swipe-to-dismiss gestures
- Smooth animations
- Responsive sizing
- Auto-close when actions taken

#### Content Drawers

1. **Recent History Drawer** - Last 10 lookups with one-tap reload
2. **Trade News Drawer** - Live trade data and regulatory updates
3. **Analytics Drawer** - Trade insights and statistics
4. **Results Drawer** - Detailed duty breakdown with save/new options

#### Navigation Drawers

1. **Full History Drawer** - Complete searchable history
2. **Settings Drawer** - All app preferences
3. **Links/Resources Drawer** - External resources and guides

## 💾 Data Management Features

### History System

- **Auto-save to history** - Optional automatic saving
- **Manual save option** - Save button in results
- **History persistence** - Survives app restarts
- **50-item limit** - Automatic cleanup of old items
- **Full result restoration** - Reload complete calculations
- **Duplicate prevention** - Same lookups aren't saved twice
- **Clear history option** - With confirmation dialog

### Settings & Preferences

- **Default country selection** - Pre-populate country field
- **Auto-save toggle** - Enable/disable automatic history
- **Show unit calculations** - Default display preference
- **Show quick tour on startup** - First-time guide toggle
- **Notifications toggle** - Push notification preferences
- **Haptic feedback toggle** - Vibration on actions
- **Clear all data** - Complete app reset option

## 📊 Advanced Features

### First-Time User Experience

- **Disclaimer modal** - Legal disclaimer on first launch
- **Interactive tour guide** - 4-step walkthrough of key features
- **"Don't show again" option** - Skip future tours
- **Contextual help** - Info tabs throughout the app

### Data Source Information

- **Live update timestamps** - Shows when data was last updated
- **HTS revision tracking** - Displays current HTS revision number
- **Data source attribution** - USITC and Federal Register notices
- **Floating info display** - Always visible at bottom of screen

### Screenshot Prevention

- **Security feature** - Prevents screenshots of duty calculations
- **Alert on attempt** - Warns users about security policy
- **Focus-based activation** - Only active on results screen

### Trade News Integration

- **Live trade data** - Real-time import/export statistics
- **Government bulletins** - CBP, USTR, Federal Register updates
- **Priority sorting** - High-priority news appears first
- **Visual indicators** - Charts and trend arrows
- **In-app browser** - View full articles without leaving app
- **Automatic refresh** - Updates when screen focused

## 🔍 Search & Lookup Features

### HTS Code Search

- **Segmented data architecture** - Fast searches via 100+ segments
- **Real-time suggestions** - Shows up to 15 matches
- **Scroll indicator** - Shows when more results available
- **No results handling** - Clear messaging when no matches
- **8-digit limit** - Prevents invalid codes

### Country Features

- **"None" option** - Clear default country selection
- **Special duty indicators** - Shows which countries have special rates
- **Country code display** - Shows ISO codes in history
- **USMCA countries** - Special handling for CA/MX

## 📈 Reporting Features (Planned)

### Session Export Modal

- **Email session data** - Send lookup history via email
- **PDF report generation** - Professional duty reports
- **Commodity guides** - Relevant guides based on HTS codes
- **Marketing opt-in** - Newsletter subscription option

### Export Formats (Backend Required)

- **CSV export** - Duty calculation breakdowns
- **PDF reports** - Formatted calculation summaries
- **Email delivery** - With HubSpot integration

## 🔐 Authentication Features

### Login System

- **Welcome vs Welcome Back** - Different messages for returning users
- **Password visibility toggle** - Show/hide password option
- **Local beta tester accounts** - Offline account storage
- **Remember credentials** - Optional credential storage

### Registration

- **Company name field** - For business users
- **Marketing preferences** - Newsletter opt-in during signup
- **Validation** - Email format and required fields

## 🎨 Visual Features

### Responsive Design

- **iPhone optimization** - Compact layouts for phones
- **iPad enhancements** - 75% larger UI elements
- **Dynamic logo sizing** - Scales based on device
- **Landscape support** - iPad adapts to orientation

### Brand Theming

- **Consistent color scheme** - Electric blue, dark navy, orange
- **Gradient backgrounds** - Diagonal hero sections
- **Shadow effects** - Depth and hierarchy
- **Rounded corners** - Modern, friendly appearance

### Animations

- **Spring animations** - Natural-feeling movements
- **Fade transitions** - Smooth screen changes
- **Diagonal FAB expansion** - Matches hero angle
- **Loading spinner** - During calculations

## 🛠 Developer Features

### Performance Monitoring

- **Timing logs** - Track operation durations
- **Cache hit rates** - Monitor data efficiency
- **Bundle size tracking** - Via check-bundle-size.sh
- **Performance test script** - Automated testing

### Error Handling

- **Network timeouts** - 5-second limits on searches
- **Graceful fallbacks** - Cached data when offline
- **User-friendly messages** - Clear error explanations
- **Retry mechanisms** - Automatic retry on failure

## 📱 Platform-Specific Features

### iOS-Specific

- **Dynamic Island support** - Top spacing for newer iPhones
- **Haptic feedback** - Tactile responses
- **In-app browser** - SFSafariViewController
- **Portrait lock** - iPhones locked to portrait

### Cross-Platform

- **React Native base** - Shared codebase
- **Platform-specific styling** - Native look and feel
- **Gesture handling** - Native gesture recognizers

## 🔄 State Management

### Persistent State

- **Settings persistence** - AsyncStorage for preferences
- **History persistence** - Survives app restarts
- **First launch tracking** - Shows appropriate onboarding
- **Guide preferences** - Remember "don't show again"

### Session State

- **Form preservation** - Maintains input during navigation
- **Result caching** - Prevents duplicate API calls
- **Drawer states** - Remembers open/closed states
- **FAB state** - Tracks manual closes

## 🌐 External Integrations

### Planned Backend Features

- **HubSpot CRM** - User tracking and marketing
- **Azure Blob Storage** - Tariff data hosting
- **Census Bureau API** - Trade statistics
- **Email services** - Report delivery
- **WebSocket updates** - Real-time tariff changes

### Current Integrations

- **Azure Functions** - Trade news feed (placeholder)
- **Live trade data service** - Import/export statistics
- **In-app web views** - External content viewing

---

## Features NOT in README but Present:

1. **Section 201 Solar Tariffs** - 14.25% on solar products
2. **Fentanyl Tariffs** - Special China penalties
3. **Trade Action Tariffs** - Russia/Belarus special rates
4. **First-Time Guide** - Interactive onboarding
5. **Screenshot Prevention** - Security feature
6. **Duty Comparison Analysis** - Compare calculation scenarios
7. **Trade News Feed** - Live updates and bulletins
8. **Analytics Dashboard** - Trade insights (placeholder)
9. **Session Export** - Email reports (UI ready, backend needed)
10. **Info Drawer System** - Contextual help for all fields
11. **Floating Info Tabs** - iPhone-specific help indicators
12. **Diagonal FAB Layout** - Unique diagonal menu expansion
13. **Result Auto-Save** - Optional automatic history saving
14. **Duplicate Prevention** - Smart history management
15. **HTS Revision Display** - Shows current data version
16. **Data Source Attribution** - Transparent data sourcing
17. **Responsive Drawer Sizing** - Adapts to device
18. **Quick Tour Toggle** - Settings control for guide
19. **Haptic Feedback Toggle** - Vibration preferences
20. **Company Name Support** - Business user features

This represents the complete feature set as of the current build.
