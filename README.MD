# HarmonyTi - Trade Duty Calculator

A React Native mobile application for calculating import duties and tariffs for international trade.

## 📱 Overview

HarmonyTi is a professional-grade iOS and Android application that helps importers, customs brokers, and trade professionals quickly calculate duties, taxes, and fees for importing goods into the United States.

### Key Features
- Real-time duty calculations based on HTS codes
- Support for Section 301, Section 232, and other special tariffs
- Country-specific duty rates and trade agreements (USMCA, etc.)
- Offline functionality with local data storage
- Per-unit cost calculations
- History tracking of previous lookups

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
- MFN (Most Favored Nation) rates
- Section 301 tariffs (China)
- Section 232 tariffs (Steel/Aluminum)
- Reciprocal tariffs
- IEEPA tariffs (Canada/Mexico)

### User Interface
- Intuitive HTS code search
- Country selection
- Value input with freight options
- Unit calculations
- History tracking
- Settings customization

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

## 📄 License

[License information]

## 👥 Team

[Team information]

---

For more detailed documentation, see the [/docs](docs/) directory.

