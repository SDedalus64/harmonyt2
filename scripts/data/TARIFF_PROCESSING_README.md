# Tariff Data Processing System

This directory contains the unified tariff data processing system for HarmonyTi.

## Quick Start

### Process ALL Tariff Entries (Default)

```bash
chmod +x process_tariff_unified.sh
./process_tariff_unified.sh tariff_data_2025/tariff_database_2025_07_01_R16.xlsx
```

### Process ONLY Section 301 Entries

```bash
./process_tariff_unified.sh tariff_data_2025/tariff_database_2025_07_01_R16.xlsx --section-301-only
```

### Extract Section 301 from PDF and Process

```bash
./process_tariff_unified.sh tariff_data_2025/tariff_database_2025_07_01_R16.xlsx \
  --extract-301 "../../scripts/pdfs/List 1.pdf" \
  --section-301-only
```

## Prerequisites

### Python Dependencies

The scripts automatically activate the virtual environment if it exists at `venv_tariff`.

First-time setup (from project root):

```bash
python3 -m venv venv_tariff
source venv_tariff/bin/activate
pip install -r requirements.txt
```

Manual activation (if needed):

```bash
source venv_tariff/bin/activate
```

The `requirements.txt` includes:

- pandas (for Excel/CSV processing)
- openpyxl (for Excel file reading)
- pdfplumber (for PDF extraction)
- Other dependencies for PDF processing

### Node.js

Required for segment generation. Ensure Node.js is installed.

### Azure CLI (Optional)

For automatic upload to Azure blob storage. Install with:

```bash
brew install azure-cli
az login
```

## Processing Modes

### 1. ALL Entries Mode (Default)

- Processes all 12,935+ HTS codes
- Generates ~237 segment files
- Includes all tariff types: Section 301, 232, 201, IEEPA, Reciprocal, Fentanyl
- Best for complete tariff database

### 2. Section 301 Only Mode

- Filters to only HTS codes with Section 301 duties
- Typically ~9,200 entries
- Generates ~158 segment files
- Requires Section 301 CSV data (from PDF extraction)
- Best for China-focused tariff analysis

## Architecture

### Input Files

- **Excel Tariff Database**: `tariff_database_2025_MM_DD_R##.xlsx`
  - Expected format: Official USITC HTS database
  - Naming convention includes date and revision (e.g., R16)

- **Section 301 PDFs** (optional):
  - List 1, 2, 3, 4a PDFs from USTR
  - Contains HTS codes subject to Section 301 duties

### Processing Pipeline

1. **Excel to CSV Conversion** (`excel_to_csv.py`)
   - Converts USITC Excel format to CSV
   - Preserves all columns and data

2. **Tariff Data Processing**
   - **All entries**: `preprocess_tariff_data.py`
   - **Section 301 only**: `preprocess_tariff_data_new.py`
   - Adds special tariff calculations
   - Injects extra tariffs (Reciprocal, IEEPA, etc.)
   - Outputs JSON with structured data

3. **Segmentation** (`segment-tariff-data.js`)
   - Splits data by 3-digit HTS prefix
   - Creates individual JSON files per segment
   - Generates segment index for app navigation

4. **Azure Upload** (optional)
   - Uploads segments to blob storage
   - Path: `$web/TCalc/data/tariff-segments/`

### Output Structure

```
scripts/data/
├── tariff_database_2025_MMDDYYYY.csv      # Converted CSV
├── tariff_processed_MMDDYYYY_R##.json     # Processed JSON
└── tariff-segments/                        # Segment files
    ├── segment-index.json                  # Index with metadata
    ├── tariff-100.json                     # HTS codes 100xxx
    ├── tariff-101.json                     # HTS codes 101xxx
    └── ...                                 # One file per 3-digit prefix
```

## Configuration

### Hybrid Architecture

The system uses a shared configuration approach:

- `scripts/config/tariff_rules.json` - Single source of truth
- `src/config/tariffRulesConfig.ts` - TypeScript wrapper with rollback flag

### Special Tariff Types

1. **Section 301** (China)
   - Lists 1-3: 25% additional
   - List 4a: 7.5% additional

2. **Section 232** (Steel/Aluminum)
   - Steel/Aluminum: 50% (25% for UK)

3. **Section 201** (Solar)
   - Solar cells/modules: 14% safeguard
   - Country exemptions apply

4. **IEEPA** (Canada/Mexico)
   - 25% standard (10% for energy/potash)
   - USMCA origin exempt

5. **Reciprocal** (China)
   - 10% temporary (90-day agreements)

6. **Fentanyl** (China)
   - 20% anti-trafficking measure

## Troubleshooting

### Missing pandas/openpyxl

The scripts should automatically activate the virtual environment. If you still see module errors:

```bash
# From project root
python3 -m venv venv_tariff
source venv_tariff/bin/activate
pip install -r requirements.txt
```

### Section 301 CSV not found

Run extraction first:

```bash
python3 extract_section301_from_pdf.py "path/to/List 1.pdf"
cd .. && python3 deduplicate_section301.py
```

### Wrong segment directory

Fixed in latest version. Old segments may be in `data/data/tariff-segments/`.
Move them to `data/tariff-segments/`.

### Azure upload fails

- Ensure you're logged in: `az login`
- Check permissions on storage account
- Verify container name is `$web`

## Legacy Scripts

These scripts are kept for reference but superseded by `process_tariff_unified.sh`:

- `process_tariff_complete.sh` - Section 301 only processing
- `process_tariff_all.sh` - All entries processing
- `update_tariff_simple.sh` - Basic update script
- `update_tariff_legacy.sh` - Old processing approach

## Development

To add new tariff types:

1. Update `scripts/config/tariff_rules.json`
2. Modify `preprocess_tariff_data.py` to handle new rules
3. Update TypeScript services if needed
4. Test with both processing modes
