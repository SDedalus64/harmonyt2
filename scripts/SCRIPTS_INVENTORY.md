# Scripts Inventory

This document provides a comprehensive list of all scripts in the HarmonyTi project, organized by category.

## Setup Scripts

### `/scripts/setup/`

#### `setup_env.sh`

- **Purpose**: Sets up the development environment
- **Usage**: `./scripts/setup/setup_env.sh`
- **Functions**:
  - Installs dependencies
  - Sets up environment variables
  - Configures development settings

#### `ios_prebuild.sh`

- **Purpose**: Prepares iOS build environment and fixes common issues
- **Usage**: `./scripts/setup/ios_prebuild.sh`
- **Functions**:
  - Cleans iOS build artifacts
  - Reinstalls pods
  - Fixes known Xcode warnings
  - Applies required patches

#### `install-git-hooks.sh`

- **Purpose**: Installs git hooks for development workflow
- **Usage**: `./scripts/setup/install-git-hooks.sh`
- **Functions**:
  - Sets up pre-commit hook for changelog reminders
  - Ensures developers update CHANGELOG.md for user-facing changes

## Data Processing Scripts

### `/scripts/data/`

#### `process_tariff_complete.sh`

- **Purpose**: Complete tariff data processing pipeline
- **Usage**: `./scripts/data/process_tariff_complete.sh input.xlsx [revision-number]`
- **Functions**:
  - Processes Excel to CSV
  - Runs Python preprocessing
  - Generates JSON segments
  - Verifies output
  - Updates metadata
  - Uploads to Azure (segments only)

#### `excel_to_csv.py`

- **Purpose**: Converts Excel tariff files to CSV format
- **Usage**: `python3 scripts/data/excel_to_csv.py input.xlsx output.csv`
- **Dependencies**: pandas, openpyxl

#### `preprocess_tariff_data.py`

- **Purpose**: Processes CSV tariff data into JSON format
- **Usage**: `python3 scripts/data/preprocess_tariff_data.py input.csv output.json [revision]`
- **Functions**:
  - Cleans data
  - Structures JSON
  - Adds revision metadata

#### `segment-tariff-data.js`

- **Purpose**: Splits large tariff JSON into smaller segments
- **Usage**: `node scripts/data/segment-tariff-data.js`
- **Output**:
  - Single-digit segments (0-9)
  - Two-digit segments for large chapters
  - Index file for navigation

#### `verify-segments.js`

- **Purpose**: Validates segmented tariff data integrity
- **Usage**: `node scripts/data/verify-segments.js`
- **Checks**:
  - All segments present
  - Data integrity
  - Index accuracy

#### `extract_hts_revision.py`

- **Purpose**: Extracts HTS revision number from tariff files
- **Usage**: `python3 scripts/data/extract_hts_revision.py input.xlsx`

## Utility Scripts

### `/scripts/utilities/`

#### `cleanup.sh`

- **Purpose**: Comprehensive cleanup of build artifacts
- **Usage**: `./scripts/utilities/cleanup.sh`
- **Cleans**:
  - Node modules
  - Build folders
  - Cache directories
  - Temporary files

#### `fix-xcode-warnings.sh`

- **Purpose**: Fixes common Xcode build warnings
- **Usage**: `./scripts/utilities/fix-xcode-warnings.sh`
- **Fixes**:
  - Sandbox sync issues
  - Double-quoted includes
  - Build settings

#### `performance_test.js`

- **Purpose**: Tests app performance metrics
- **Usage**: `node scripts/utilities/performance_test.js`
- **Measures**:
  - Startup time
  - Data loading
  - Search performance

## Configuration Scripts

### `/scripts/config/`

#### Trade Rules Files

- `trade_rules.csv` - Current trade rules configuration
- `trade_rules_legacy.csv` - Historical trade rules reference

## Archive Scripts

### `/scripts/Archive tariff data/`

Contains historical tariff data files for reference.

## Usage Tips

1. **Always run scripts from the project root directory**
2. **Check script permissions** - use `chmod +x script.sh` if needed
3. **Review script output** for any errors or warnings
4. **For data processing**, follow this order:
   - Excel → CSV (if needed)
   - CSV → JSON
   - JSON → Segments
   - Verify segments
   - Upload to Azure

## Adding New Scripts

When adding new scripts:

1. Place in appropriate category folder
2. Add clear documentation in the script
3. Update this inventory
4. Include usage examples
5. Document any dependencies
