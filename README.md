# HarmonyTi

HarmonyTi is a React Native app built with Expo for performing tariff lookups and calculations. This repository contains the source code along with scripts and documentation used to build the project for iOS and Android.

## Installation

1. Install [Node.js](https://nodejs.org/) and either `npm` or `yarn`.
2. Install JavaScript dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Install iOS pods (macOS only):
   ```bash
   cd ios && pod install && cd ..
   ```

See `docs/build-guides/PREBUILD_INSTRUCTIONS.md` for a complete prebuild checklist.

## Running the App

Start the Metro bundler and run the app on a device or simulator:

```bash
npm start            # starts Expo with dev client
npm run ios          # run on iOS simulator/device
npm run android      # run on Android emulator/device
```

Additional development commands are available in `package.json`. Refer to the cheat sheets in `docs/cheatsheets` for handy CLI snippets.

## Testing

Automated tests are not currently included, but a performance script is provided:

```bash
node scripts/performance-test.js
```

For detailed testing steps (simulator setup, performance metrics, troubleshooting), read `docs/azure-only-testing.md` and `docs/simulator-test-guide.md`.

## Documentation

Extensive guides, build instructions and other documentation are located in the [`docs`](docs) directory. Start with `docs/README.md` for an overview of what is available.
