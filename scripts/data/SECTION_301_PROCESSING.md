# Section 301 Tariff Processing for HarmonyTi

This workflow processes tariff data to include ONLY HTS codes that have Section 301 add-ons,
as requested for HarmonyTi Results and Tariff Intelligence features.

## Prerequisites

1. **Section 301 Lists Extracted**: You must have already extracted all Section 301 lists (1, 2, 3, and 4a)
2. **Section 301 Deduplicated CSV**: The file `scripts/exports/section301_deduplicated.csv` must exist
3. **Tariff Database Excel**: The main tariff database Excel file from USITC

## Step-by-Step Process

### 1. Extract Section 301 Lists (if not already done)

```bash
cd scripts
python extract_section301_list.py 1
python extract_section301_list.py 2
python extract_section301_list.py 3
python extract_section301_list.py 4a
```

### 2. Deduplicate Section 301 Lists

```bash
python combine_section301_lists.py
python deduplicate_section301_lists.py
```

### 3. Process Tariff Data with Section 301 Filter

```bash
cd data
./process_tariff_complete.sh tariff_database_2025_06232025.xlsx 16
```

## What This Does

1. **Converts** Excel tariff data to CSV
2. **Loads** Section 301 deduplicated data
3. **Filters** tariff database to ONLY include HTS codes that appear in Section 301 lists
4. **Adds** Section 301 list number and applicable percentage to each entry
5. **Generates** segmented JSON files for efficient loading

## Output

The processed data will include:

- `section_301_list`: The list number (1, 2, 3, or 4a)
- `section_301_rate`: The applicable percentage (25% for lists 1-3, 7.5% for list 4a)
- All standard tariff data fields

## Section 301 Rates

- **Lists 1, 2, 3**: 25% additional tariff
- **List 4a**: 7.5% additional tariff

## Important Notes

1. The output will contain ONLY HTS codes that have Section 301 add-ons
2. This is designed specifically for HarmonyTi's Results and Tariff Intelligence features
3. The "latest list wins" rule is already applied in the deduplicated data
4. Section 232 (Steel/Aluminum) tariffs are also included if applicable

## Verification

After processing, check:

- Entry count should match the deduplicated Section 301 count (~10,717 entries)
- JSON file should show `"section_301_only": true` in metadata
- Each entry should have `section_301_list` and `section_301_rate` fields
