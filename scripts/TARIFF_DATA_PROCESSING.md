# Tariff Data Processing from HTS CSV Download

## Overview

This guide explains how to process HTS (Harmonized Tariff Schedule) data downloads for use in the Harmony app. The process converts CSV data into optimized JSON format and creates segmented files for efficient loading.

## Prerequisites

- Python 3 installed
- Node.js installed
- HTS CSV file downloaded from USITC
- Change Record PDF (to identify the revision number)

## Quick Start (One Command)

From the Harmony folder, simply run:

```bash
scripts/update_tariffs
```

This command will:

1. Find your latest CSV file automatically
2. Ask you for the revision number
3. Process everything and prepare files for upload

## Step-by-Step Process

### 1. Prepare Your Files

Place these files in the `scripts` directory:

- **CSV file**: `tariff_database_2025_MMDDYYYY.csv` (from https://hts.usitc.gov/download/archive most recent link, e.g. [2025 HTS Revision 15 (06/23/2025)](https://hts.usitc.gov/download?release=2025HTSRev15&releaseDate=06%2F16%2F2025) download)
- **Change Record PDF**:
  - Found at https://hts.usitc.gov.
  - The corresponding Change Record
    - (e.g. Change Record https://hts.usitc.gov/reststop/file?release=currentRelease&filename=Change%20RecordPlace

  - Save to `scripts/data/`
    - Used to

### 2. Find the HTS Revision Number

Open the Change Record PDF and look for patterns like:

- "HTS 2025 Revision 15"
- "2025 HTS Revision 15"
- "Revision 15 to the 2025 HTS"

### 3. Run the Update Command

From the Harmony directory:

```bash
scripts/update_tariffs
```

When prompted, enter just the revision number (e.g., `14`)

### 4. What Happens

The script will:

- Process the CSV file with the revision number
- Add China tariff split (10% Reciprocal + 20% Fentanyl)
- Add IEEPA tariffs for Canada/Mexico
- Apply all current Section 232, Section 301 tariffs
- Generate optimized segment files
- Show file sizes and counts

### 5. Upload to Azure

The script automatically uploads segment files if Azure CLI is installed.
If manual upload is needed:

- Upload all files from `scripts/data/tariff-segments/` to Azure
- Note: The main `tariff_processed_MMDDYYYY.json` file is no longer uploaded (segmented architecture)

### File Locations

- **Input**: `scripts/tariff_database_2025_MMDDYYYY.xlsx (or .csv)`
- **Intermediate JSON**: `scripts/tariff_processed_MMDDYYYY.json` (local only, not uploaded)
- **Segments**: `scripts/data/tariff-segments/*.json` (uploaded to Azure)

## What the App Will Show

After uploading, the app header will display:

```
Data Last Updated: YYYY-MM-DD | HTS Revision XX
```

## Manual Processing (Advanced)

If you need more control, you can run the steps manually:

```bash
cd scripts

# 1. Process with revision
python3 preprocess_tariff_data.py tariff_database_2025_MMDDYYYY.csv tariff_processed_MMDDYYYY.json "Revision 14"

# 2. Generate segments
node segment-tariff-data.js tariff_processed_MMDDYYYY.json
```

## Troubleshooting

### "No tariff CSV files found"

- Make sure your CSV file is in the `scripts` directory
- File should match pattern: `tariff_database_*.csv`

### "Failed to process tariff data"

- Check that Python 3 is installed: `python3 --version`
- Ensure the CSV file is not corrupted

### "Failed to generate segments"

- Check that Node.js is installed: `node --version`
- Ensure the JSON file was created successfully

## Current Tariff Configuration

The processing automatically applies:

- **China**: 10% Reciprocal (expires Aug 12, 2025) + 20% Fentanyl (permanent)
- **Canada/Mexico**: 25% IEEPA (10% for energy/potash)
- **Section 232**: Steel/Aluminum 50% (UK 25%)
- **Section 301**: China Lists 1-4A
- **MPF Exemption**: USMCA-qualified goods from Canada/Mexico

## Notes

- Always check the Change Record for the correct revision number
- Each HTS update has its own revision - never reuse old numbers
- The CSV file is the source of truth - Excel files are not needed
- Processing takes about 30-60 seconds depending on system speed
