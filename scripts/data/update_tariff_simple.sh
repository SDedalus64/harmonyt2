#!/bin/bash

# Update tariff data (simple version - no Section 301 filtering)
# This version processes ALL HTS codes, not just Section 301

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to scripts directory
cd "$SCRIPT_DIR" || {
    echo "Failed to change to scripts directory"
    exit 1
}

echo "Current directory: $(pwd)"

# Find the latest tariff CSV file
# Look for new format first (tariff_database_2025_MM_DD_R##.xlsx)
LATEST_EXCEL=$(ls -t tariff_data_2025/tariff_database_*.xlsx 2>/dev/null | head -1)

if [ -z "$LATEST_EXCEL" ]; then
    # Try old format in current directory
LATEST_CSV=$(ls -t tariff_database_*.csv 2>/dev/null | head -1)

if [ -z "$LATEST_CSV" ]; then
        echo "No tariff database files found!"
        echo "Please place your tariff_database_2025_MM_DD_R##.xlsx file in the tariff_data_2025 directory"
    exit 1
fi

    echo "Using existing CSV: $LATEST_CSV"
    CSV_FILE="$LATEST_CSV"

    # Extract date from old format for output naming
    DATE_PART=$(basename "$CSV_FILE" | grep -oE '[0-9]{8}' | tail -1)
    REVISION=""
else
    # Process Excel file with new format
    echo "Found Excel file: $LATEST_EXCEL"
    
    # Extract date and revision from filename
    FILENAME=$(basename "$LATEST_EXCEL")
    
    # Extract date part (MM_DD) - specifically after the year
    DATE_PART=$(echo "$FILENAME" | sed -n 's/.*2025_\([0-9][0-9]_[0-9][0-9]\).*/\1/p')
    
    # Convert MM_DD to MMDDYYYY format
    MONTH=$(echo "$DATE_PART" | cut -d'_' -f1)
    DAY=$(echo "$DATE_PART" | cut -d'_' -f2)
    YEAR="2025"
    DATE_FORMATTED="${MONTH}${DAY}${YEAR}"
    
    # Extract revision from filename
    REVISION=$(echo "$FILENAME" | grep -oE 'R[0-9]+' | grep -oE '[0-9]+')
    
    # Convert to CSV
    CSV_FILE="tariff_database_2025_${DATE_FORMATTED}.csv"
    echo "Converting Excel to CSV..."
    python3 excel_to_csv.py "$LATEST_EXCEL" "$CSV_FILE"

if [ $? -ne 0 ]; then
        echo "Failed to convert Excel to CSV"
    exit 1
fi
    echo "✓ CSV conversion complete"
fi

# Set output JSON filename
if [ -n "$REVISION" ]; then
    JSON_FILE="tariff_processed_${DATE_FORMATTED}_R${REVISION}.json"
else
    JSON_FILE="tariff_processed_${DATE_PART}.json"
fi

# Prompt for HTS revision if not extracted from filename
if [ -z "$REVISION" ]; then
    read -p "Enter the HTS revision number (e.g., 14, 15, 16): " REVISION
fi

echo "Processing tariff data..."
echo "  CSV: $CSV_FILE"
echo "  Revision: $REVISION"
echo "  Output: $JSON_FILE"

# Process the CSV file without Section 301 filtering
python3 preprocess_tariff_data.py "$CSV_FILE" "$JSON_FILE" "$REVISION"

if [ $? -eq 0 ]; then
    echo "✓ Tariff data processing complete"
    echo "✓ Generated: $JSON_FILE"
    
    # Count entries
    ENTRY_COUNT=$(grep -c '"hts8"' "$JSON_FILE" 2>/dev/null || echo "0")
    echo "✓ Total HTS codes processed: $ENTRY_COUNT"
else
    echo "✗ Failed to process tariff data"
    exit 1
fi
