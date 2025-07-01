# Scripts Inventory

This document provides a comprehensive overview of all scripts in the HarmonyTi project, organized by category.

## Script Organization

### `/scripts/setup/` - Setup and Installation Scripts

#### `ios_prebuild.sh` ✅ ACTIVE

- **Purpose**: Automates the full iOS pre-build workflow
- **Usage**: Run from project root: `./scripts/setup/ios_prebuild.sh`
- **Features**:
  - Checks for Xcode running
  - Cleans native directories and caches
  - Runs expo prebuild
  - Installs CocoaPods
  - Fixes Xcode warnings
  - Sets proper permissions

#### `setup_env.sh` ✅ ACTIVE

- **Purpose**: Sets up the development environment
- **Usage**: `./scripts/setup/setup_env.sh`

### `/scripts/build/` - Build and Analysis Scripts

#### `check-bundle-size.sh` ✅ ACTIVE

- **Purpose**: Analyzes JavaScript bundle size
- **Usage**: `./scripts/build/check-bundle-size.sh`

#### `increment-build.js` ✅ ACTIVE

- **Purpose**: Increments build numbers in app.json
- **Usage**: `node scripts/build/increment-build.js`

### `/scripts/utilities/` - Utility Scripts

#### `cleanup.sh` ✅ ACTIVE

- **Purpose**: Comprehensive cleanup of build artifacts, caches, and temporary files
- **Usage**: `./scripts/utilities/cleanup.sh`
- **Features**:
  - Clears Metro cache
  - Cleans Xcode DerivedData
  - Removes node_modules and reinstalls
  - Cleans iOS and Android builds

#### `fix-xcode-warnings.sh` ✅ ACTIVE

- **Purpose**: Fixes Xcode sandbox script warnings
- **Usage**: `./scripts/utilities/fix-xcode-warnings.sh`
- **Critical**: Must be run after expo prebuild

#### `performance_test.js` ✅ ACTIVE

- **Purpose**: Tests tariff data loading and search performance
- **Usage**: `node scripts/utilities/performance_test.js`

### `/scripts/data/` - Data Processing Scripts

#### Primary Scripts (Use These)

##### `process_tariff_complete.sh` ✅ ACTIVE - RECOMMENDED

- **Purpose**: Complete tariff data processing workflow with Azure upload
- **Usage**: `./scripts/data/process_tariff_complete.sh <excel-file> [revision]`
- **Features**:
  - Converts Excel to CSV
  - Processes with HTS revision
  - Generates segments
  - Uploads to Azure automatically
  - Most comprehensive solution

##### `update_tariff_simple.sh` ✅ ACTIVE

- **Purpose**: Simple tariff update script with interactive prompts
- **Usage**: `./scripts/data/update_tariff_simple.sh`
- **Features**:
  - Finds latest CSV automatically
  - Prompts for revision number
  - Clear status messages
  - Good for quick updates

#### Legacy Scripts (Deprecated)

##### `update_tariff_legacy.sh` ⚠️ LEGACY

- **Purpose**: Old tariff update workflow
- **Status**: Superseded by process_tariff_complete.sh
- **Note**: References old file structure

#### Supporting Python Scripts

##### `preprocess_tariff_data.py` ✅ ACTIVE

- **Purpose**: Core tariff data processor
- **Usage**: Called by shell scripts
- **Features**:
  - Processes CSV to JSON
  - Handles HTS revision injection
  - Adds extra tariffs with --inject-extra-tariffs flag

##### `excel_to_csv.py` ✅ ACTIVE

- **Purpose**: Converts Excel tariff files to CSV
- **Usage**: `python3 scripts/data/excel_to_csv.py input.xlsx output.csv`

##### `extract_hts_revision.py` ✅ ACTIVE

- **Purpose**: Extracts HTS revision from Change Record PDFs
- **Usage**: `python3 scripts/data/extract_hts_revision.py "Change Record.pdf"`

#### Supporting JavaScript Scripts

##### `segment-tariff-data.js` ✅ ACTIVE

- **Purpose**: Splits large tariff JSON into segments
- **Usage**: `node scripts/data/segment-tariff-data.js tariff_processed.json`

##### `verify-segments.js` ✅ ACTIVE

- **Purpose**: Verifies segment integrity
- **Usage**: `node scripts/data/verify-segments.js tariff_processed.json`

### `/scripts/config/` - Configuration Files

- Contains trade rules CSVs and other configuration data

### `/scripts/Archive tariff data/` - Historical Data

- Contains archived tariff databases for reference

## Usage Recommendations

### For iOS Build Preparation:

```bash
./scripts/setup/ios_prebuild.sh
```

### For Tariff Data Updates:

```bash
# Recommended: Full workflow with Azure upload
./scripts/data/process_tariff_complete.sh data/tariff_database_2025_MMDDYYYY.xlsx 14

# Alternative: Simple interactive update
./scripts/data/update_tariff_simple.sh
```

### For Troubleshooting:

```bash
# Deep clean everything
./scripts/utilities/cleanup.sh

# Fix Xcode warnings after prebuild
./scripts/utilities/fix-xcode-warnings.sh
```

### For Performance Testing:

```bash
node scripts/utilities/performance_test.js
```

## Script Dependencies

1. **Tariff Processing Scripts** require:
   - Python 3 with pandas, openpyxl
   - Node.js for segmentation
   - Azure CLI for uploads (optional)

2. **iOS Build Scripts** require:
   - Xcode
   - CocoaPods
   - Expo CLI

3. **All scripts** assume:
   - Project root as working directory
   - Proper file permissions (chmod +x)

## Maintenance Notes

- Always run scripts from project root unless specified otherwise
- The `process_tariff_complete.sh` script is the most maintained and feature-complete
- Legacy scripts are kept for reference but should not be used for new work
- Script paths have been updated to reflect new organization structure
