# HarmonyTi Project Structure

## Overview

This document describes the organized structure of the HarmonyTi project after reorganization.

## Directory Structure

### `/archives`

Contains archived deployment packages and exports:

- `deploy.zip` - Deployment package
- `trade_news.zip` - Trade news data archive
- `tradeNewsfeed.zip` - Trade news feed archive

### `/backups`

Contains backup configuration files:

- `jest.config.js.bak` - Jest configuration backup
- `tsconfig.json.bak` - TypeScript configuration backup
- `.yarnrc.yml.bak` - Yarn configuration backup

### `/build-artifacts`

Contains build outputs and logs:

- `debugRelease.map` - Debug release source map
- `debugRelease.jsbundle` - Debug release bundle
- `tmp_main.jsbundle` - Temporary main bundle
- `build.log` - Build process log
- `test-results.json` - Test execution results
- `pod-install.log` - iOS pod installation log

### `/data`

Organized data files:

- `/tariff-exports` - Processed tariff JSON files
  - `tariff_processed_06232025.json`
  - `tariff_processed.json`
- `/csv-exports` - CSV data exports
  - `Duty_Calculation_Breakdown.csv`

### `/docs`

Documentation organized by category:

- `/api` - API documentation
  - `API SETUP.md`
- `/features` - Feature documentation
  - `Section 301_232 application.md`
- `/development` - Development guides
  - `RUN-SIMULATOR-TEST.txt`
- `/build-guides` - Build and deployment guides
- `/cheatsheets` - Quick reference guides
- `/archive` - Archived documentation

### `/images`

All image assets including:

- `Dedola_Black.png`
- `Dedola_Colorful.png`
- `Dedola_White.png`

### `/scripts`

Organized scripts by purpose:

- `/setup` - Setup and prebuild scripts
  - `ios_prebuild.sh` - iOS pre-build workflow
  - `setup_env.sh` - Environment setup
- `/utilities` - Utility scripts
  - `cleanup.sh` - Clean build artifacts
  - `fix-xcode-warnings.sh` - Fix Xcode warnings
  - `performance_test.js` - Performance testing
- `/build` - Build-related scripts
  - `check-bundle-size.sh` - Bundle size analysis
  - `increment-build.js` - Build number increment
- `/data` - Data processing scripts
  - `process_tariff_complete.sh` - Full tariff processing (recommended)
  - `update_tariff_simple.sh` - Simple tariff update
  - Supporting Python/JS scripts for data processing
- `/config` - Configuration files (trade rules, etc.)
- `SCRIPTS_INVENTORY.md` - Complete script documentation

### `/tests`

Organized test files:

- `/integration` - Integration tests
  - `test_china_nuclear_tariffs.js`
  - `test_china_tariffs.js`
  - `test_azure_data.js`
  - `test_duty_calculation.js`
  - `test_section232.js`
  - `debug_test.js`
- `/unit` - Unit tests (to be populated)
- `/golden` - Golden test files

## Root Directory

The following files remain in the root as they belong there:

- Configuration files: `package.json`, `tsconfig.json`, `app.json`, `eas.json`, `metro.config.js`, `.eslintrc.js`, `.gitignore`
- Main application files: `App.tsx`, `index.ts`
- Documentation: `README.MD`
- Lock files: `yarn.lock`, `package-lock.json`
- Source directories: `/src`, `/ios`, `/android`, `/assets`

## Benefits of This Structure

1. **Clear separation of concerns** - Test files, scripts, and data are organized by purpose
2. **Easier navigation** - Related files are grouped together
3. **Cleaner root directory** - Only essential configuration and entry files remain at root
4. **Better maintainability** - Clear locations for different types of files
5. **Improved collaboration** - Team members can easily find what they need

## Adding New Files

When adding new files to the project:

- Test files → `/tests/integration` or `/tests/unit`
- Scripts → `/scripts/` (in appropriate subdirectory)
- Documentation → `/docs/` (in appropriate subdirectory)
- Build outputs → `/build-artifacts/`
- Data files → `/data/`
- Archives → `/archives/`
