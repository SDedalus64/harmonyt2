# HarmonyTi - Comprehensive App Description

## Overview

HarmonyTi is a professional React Native mobile application for iOS and Android that calculates import duties, tariffs, and fees for goods entering the United States. The app provides instant duty calculations based on HTS (Harmonized Tariff Schedule) codes, helping importers, customs brokers, and trade professionals make informed decisions about international trade costs.

## Core Functionality

### Tariff Calculation Engine

• **Real-time duty calculations** - Instant results based on HTS code and country of origin
• **Multiple tariff types supported:**

- MFN (Most Favored Nation) base rates
- Section 301 tariffs on Chinese goods (Lists 1-4A)
- Section 232 steel/aluminum tariffs (50% global, 25% UK)
- Section 201 solar product tariffs (14.25%)
- Reciprocal tariffs (China 25%, UK 25%)
- IEEPA tariffs on Canada/Mexico with exemptions
- Column 2 rates for non-NTR countries (Cuba, North Korea)
- Trade action tariffs for Russia/Belarus
  • **USMCA Origin Certificate toggle** - Enables duty-free calculations for qualified Canadian/Mexican goods
  • **Processing fees** - Automatically calculates MPF (0.3464%) and HMF (0.125%)
  • **Additive tariff stacking** - All applicable tariffs properly add together

### HTS Code Search System

• **Smart search with real-time suggestions** - Shows matches after typing 3+ digits
• **Segmented data architecture** - Fast searches across 100+ data segments
• **Comprehensive HTS database** - Contains over 20,000 product codes with descriptions
• **Intelligent matching** - Searches both codes and product descriptions
• **8-digit code validation** - Prevents invalid entries

### Value & Cost Calculations

• **Declared value input** - Base value for duty calculations with currency formatting
• **Optional freight cost** - Includes shipping in landed cost calculations
• **Per-unit cost analysis** - Shows cost per unit with and without tariffs when unit count provided
• **Total landed cost** - Complete cost including all duties, fees, and freight
• **Duty comparison** - Analyzes impact of reciprocal tariffs

## User Interface Features

### Main Lookup Screen

• **Clean, professional design** with Geologica custom font throughout
• **Three main input fields:**

- Country of origin selector (50+ countries)
- HTS code with smart suggestions dropdown
- Declared value with automatic currency formatting
  • **Optional fields:**
- Freight cost for landed calculations
- Unit count for per-unit analysis
- Additional costs (customs fees, etc.)
  • **Field information system** - (i) icons provide detailed help for each input
  • **Responsive layout** - Optimized for both iPhone and iPad

### Floating Action Button (FAB) Menu

• **Main FAB in bottom-right** - Expands diagonally to reveal 7 options:

- Recent (blue) - Load most recent lookup
- History (medium blue) - View full history
- Tariff Intelligence (purple) - Smart tariff alternatives
- Trade News (green) - Live trade updates
- Blog (orange) - Industry insights
- Analytics (info blue) - Trade statistics
- Settings (gray) - User preferences
  • **Smart auto-collapse** - Menu closes when interacting with form
  • **Remembers user preference** - Stays closed if manually dismissed

### Drawer System

• **Results Drawer** - Shows detailed duty breakdown with save/new lookup options
• **History Drawer** - Searchable list of past lookups with one-tap restore
• **News Drawer** - Live trade data and regulatory updates
• **Analytics Drawer** - Trade insights and statistics
• **Settings Drawer** - All app preferences and options
• **Tariff Intelligence Drawer** - Smart questions about classification alternatives
• **Smooth animations** - Spring-based slide-in/out transitions
• **Swipe-to-dismiss** - Natural gesture support

### Tariff Intelligence (Beta)

• **Smart classification alternatives** - Suggests different HTS codes that might apply
• **Three types of suggestions:**

- Semantic alternatives (similar products)
- Material variations (different materials)
- Creative reclassifications (cross-chapter possibilities)
  • **Shows potential duty savings** - Compares rates between options
  • **Professional guidance prompts** - Questions to ask customs brokers
  • **Risk indicators** - Helps understand classification complexity
  • **Save to history** - Green-bordered results in history for easy reference

## Data Management

### History System

• **Automatic history tracking** - Optional auto-save after each lookup
• **Manual save option** - Save button in results for selective saving
• **50-item rolling limit** - Automatic cleanup of oldest entries
• **Full result restoration** - Complete calculation details preserved
• **Duplicate prevention** - Same lookups aren't saved multiple times
• **Search functionality** - Find past lookups by code or country
• **Visual indicators** - Tariff Intelligence results show with green border
• **Persistent storage** - History survives app restarts

### Settings & Preferences

• **User preferences:**

- Default country selection
- Auto-save to history toggle
- Show unit calculations by default
- First-time guide display
- Haptic feedback toggle
  • **Data management:**
- Clear history option
- Clear all app data
- Reset to defaults
  • **All settings persist** between app sessions

### Offline Functionality

• **Complete offline operation** - All tariff data stored locally
• **No internet required** - Calculations work without connectivity
• **Segmented data loading** - Efficient memory usage
• **Fast lookups** - Sub-second search results

## Advanced Features

### First-Time User Experience

• **Legal disclaimer** - Shows on first launch with accept requirement
• **Interactive guide** - 4-step visual tour of main features:

1. Country selection explanation
2. HTS code search tutorial
3. Value input guidance
4. Results interpretation
   • **"Don't show again" option** - User can skip future tours
   • **Contextual help throughout** - Info tabs and tooltips

### Trade News Integration

• **Live trade data feed** - Real-time import/export statistics
• **Government bulletins** - Updates from CBP, USTR, Federal Register
• **Priority sorting** - High-priority news appears first
• **Visual data presentation** - Charts, graphs, trend indicators
• **In-app browser** - Read full articles without leaving app
• **Automatic refresh** - Updates when drawer opened

### Security & Professional Features

• **Screenshot prevention** - Protects sensitive duty calculations
• **Data source transparency** - Shows USITC revision and update dates
• **Professional terminology** - Industry-standard terms and abbreviations
• **Calculation accuracy** - Matches official USITC calculations

## Technical Implementation

### Performance Features

• **React Native foundation** - Shared codebase for iOS/Android
• **TypeScript throughout** - Type-safe development
• **Optimized data architecture** - Segmented JSON for fast access
• **Responsive animations** - 60fps smooth transitions
• **Memory efficient** - Loads only needed data segments
• **Fast startup** - Sub-second launch times

### Platform Optimization

• **iOS specific:**

- Dynamic Island support
- Haptic feedback
- Native gestures
- Portrait orientation lock (iPhone)
  • **Android specific:**
- Material Design elements
- Back button handling
- Native keyboard behavior
  • **Tablet optimization:**
- Larger UI elements
- Multi-column layouts
- Landscape support

## Features Currently in Development

• **Authentication system** - Login/registration screens built but not connected
• **Backend integration** - Prepared for future cloud features
• **Email reports** - UI ready for session export functionality
• **Push notifications** - Settings toggle ready for implementation
• **WebSocket updates** - Real-time tariff change notifications planned

## What Makes HarmonyTi Unique

• **Comprehensive tariff coverage** - Handles all major US trade programs
• **Instant calculations** - No waiting for server responses
• **Professional accuracy** - Matches official government calculations
• **Smart alternatives** - Tariff Intelligence suggests classification options
• **Beautiful, intuitive UI** - Makes complex calculations simple
• **Complete offline operation** - Works anywhere, anytime
• **Regular data updates** - Current HTS revision maintained
• **Free to use** - No subscriptions or hidden fees

## Target Users

• **Import/export professionals** - Quick duty estimates
• **Customs brokers** - Client consultations and quotes
• **International buyers** - Total landed cost calculations
• **Supply chain managers** - Sourcing decisions
• **Trade consultants** - Classification research
• **Small businesses** - International expansion planning

---

_This description represents the current production features as of the latest build. Features marked as "in development" have UI elements present but are not yet functional._
