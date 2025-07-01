# HarmonyTi - Trade Duty Calculator

A React Native mobile application for calculating import duties and tariffs for international trade.

## 📱 Overview

HarmonyTi is a professional-grade iOS and Android application that helps importers, customs brokers, and trade professionals quickly calculate duties, taxes, and fees for importing goods into the United States.

### Key Features
- Real-time duty calculations based on HTS codes with smart search suggestions
- Support for Section 301, Section 232, Section 201, and other special tariffs
- Country-specific duty rates and trade agreements (USMCA, etc.)
- USMCA Origin Certificate toggle for duty-free qualified goods
- Offline functionality with segmented data architecture
- Per-unit cost calculations with landed cost analysis
- Auto-save history tracking with full result restoration
- Trade news feed with live import/export data
- Interactive first-time user guide
- Security features including screenshot prevention

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Yarn package manager
- Xcode 14+ (for iOS development)
- Android Studio (for Android development)
- React Native development environment set up

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd harmonyt2
```

2. Install dependencies:
```bash
yarn install
```

3. Install iOS pods (iOS only):
```bash
cd ios && pod install && cd ..
```

4. Set up environment:
```bash
chmod +x scripts/setup/setup_env.sh
./scripts/setup/setup_env.sh
```

### Running the App

**iOS Simulator:**
```bash
yarn ios
# or
expo run:ios
```

**Android Emulator:**
```bash
yarn android
# or
expo run:android
```

**Start Metro bundler:**
```bash
yarn start
# or
npm start
```

## 📁 Project Structure

See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for detailed project organization.

### Key Directories:
- `/src` - Source code
- `/scripts` - Build and utility scripts  
- `/tests` - Test files
- `/docs` - Documentation

## 🧪 Testing

Run tests:
```bash
yarn test
```

Run tests in watch mode:
```bash
yarn test:watch
```

Lint code:
```bash
yarn lint
```

Integration tests are located in `/tests/integration/`

## 📊 Data Management

The app uses segmented tariff data stored locally:
- Data is split into ~100 JSON segments for performance
- Updates are processed via `scripts/data/process_tariff_complete.sh`
- Displays current HTS revision number and last update date
- See [scripts/TARIFF_DATA_PROCESSING.md](scripts/TARIFF_DATA_PROCESSING.md) for details
- See [scripts/SCRIPTS_INVENTORY.md](scripts/SCRIPTS_INVENTORY.md) for all available scripts

## 🔧 Configuration

- **Metro**: Configured with custom resolver for package exports
- **TypeScript**: Strict mode enabled
- **ESLint**: Custom rules for React Native
- **Patch-package**: Applied automatically on install to fix dependencies
- **Husky**: Git hooks for code quality

## 📱 Features

### Tariff Calculations
- **MFN (Most Favored Nation) rates** - Base duty rates
- **Section 301 tariffs** - China-specific (Lists 1-4A)
- **Section 232 tariffs** - Steel/Aluminum (50% global, 25% UK)
- **Section 201 tariffs** - Solar products (14.25%)
- **Reciprocal tariffs** - Country-specific retaliatory
- **IEEPA tariffs** - Canada/Mexico with exemptions
- **Fentanyl tariffs** - Special China penalties
- **Column 2 rates** - Non-NTR countries (Cuba, North Korea)
- **Processing fees** - MPF (0.3464%) and HMF (0.125%)

### User Interface
- **Smart HTS code search** - Real-time suggestions after 3 digits
- **Country selection** - 50+ countries with special duty indicators
- **Value input** - Declared value with optional freight costs
- **Unit calculations** - Per-unit costs with/without tariffs
- **Landed cost analysis** - Total cost including all duties
- **USMCA toggle** - For Canada/Mexico origin certificates
- **Floating Action Button (FAB)** - 6-button diagonal menu system
- **Multiple drawer system** - Results, history, news, settings
- **Field info system** - Contextual help for all inputs

### Data Features
- **History tracking** - Auto-save option with 50-item limit
- **Duplicate prevention** - Smart history management
- **Full result restoration** - Reload complete calculations
- **Settings persistence** - Remember preferences
- **Offline functionality** - All data stored locally

### Advanced Features
- **Trade news feed** - Live trade data and government bulletins
- **Analytics dashboard** - Trade insights and statistics
- **First-time guide** - Interactive 4-step walkthrough
- **Screenshot prevention** - Security for duty calculations
- **Duty comparison** - Analyze scenarios with/without tariffs
- **Data attribution** - Shows USITC and Federal Register sources
- **Responsive design** - Optimized for iPhone and iPad

### Settings & Preferences
- **Auto-save toggle** - Enable/disable automatic history
- **Default country** - Pre-populate country selection
- **Quick tour toggle** - Control first-time guide display
- **Haptic feedback** - Vibration preferences
- **Clear all data** - Complete app reset option

## 🏗️ Building

Create production bundle:
```bash
yarn build
```

## 🛠 Development

For development documentation:
- Build guides: [docs/build-guides/](docs/build-guides/)
- Development guides: [docs/development/](docs/development/)
- API documentation: [docs/api/](docs/api/)

## 📝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting pull requests. 

**Important**: All user-facing changes must be documented in [CHANGELOG.md](CHANGELOG.md).

## 📋 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes and releases.

## 📄 License

[License information]

## 👥 Team

[Team information]

---

For more detailed documentation, see the [/docs](docs/) directory.

