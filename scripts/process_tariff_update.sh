#!/bin/bash

# Tariff Data Processing Script
# This script automates the complete tariff data processing workflow
# It can be run from any directory and will automatically find the correct paths

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# --- Azure upload defaults (can be overridden via environment variables) ---
ACCOUNT_NAME="${ACCOUNT_NAME:-cs410033fffad325ccb}"
CONTAINER_NAME="${CONTAINER_NAME:-\$web}"
DEST_PATH="${DEST_PATH:-TCalc/data}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if we found the scripts directory
if [[ ! -f "$SCRIPT_DIR/preprocess_tariff_data.py" ]]; then
    print_error "Cannot find preprocess_tariff_data.py in $SCRIPT_DIR"
    print_error "This script should be in the Harmony/scripts directory"
    exit 1
fi

# Save current directory to return to it later
ORIGINAL_DIR=$(pwd)

# Change to scripts directory
cd "$SCRIPT_DIR" || {
    print_error "Failed to change to scripts directory: $SCRIPT_DIR"
    exit 1
}

print_status "Working directory: $(pwd)"

# Check arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 <excel-file> <revision-number>"
    echo "Example: $0 data/tariff_database_2025_06062025.xlsx 'Revision 14'"
    echo ""
    echo "The excel-file path can be:"
    echo "  - Relative to current directory: data/tariff_database_2025_06062025.xlsx"
    echo "  - Relative to scripts directory: ../data/tariff_database_2025_06062025.xlsx"
    echo "  - Absolute path: /Users/you/Harmony/scripts/data/tariff_database_2025_06062025.xlsx"
    echo ""
    echo "This script will:"
    echo "  1. Convert Excel to CSV"
    echo "  2. Process tariff data with the specified revision"
    echo "  3. Generate segment files"
    exit 1
fi

EXCEL_INPUT="$1"
REVISION="$2"

# Handle different input path formats
if [[ "$EXCEL_INPUT" = /* ]]; then
    # Absolute path
    EXCEL_FILE="$EXCEL_INPUT"
elif [[ -f "$ORIGINAL_DIR/$EXCEL_INPUT" ]]; then
    # Relative to original directory
    EXCEL_FILE="$ORIGINAL_DIR/$EXCEL_INPUT"
elif [[ -f "$EXCEL_INPUT" ]]; then
    # Relative to scripts directory
    EXCEL_FILE="$(pwd)/$EXCEL_INPUT"
else
    print_error "Cannot find Excel file: $EXCEL_INPUT"
    print_error "Searched in:"
    print_error "  - $ORIGINAL_DIR/$EXCEL_INPUT"
    print_error "  - $(pwd)/$EXCEL_INPUT"
    exit 1
fi

# Extract date from filename (assuming format: tariff_database_2025_MMDDYYYY.xlsx)
DATE_PART=$(basename "$EXCEL_FILE" | grep -oE '[0-9]{8}' | tail -1)
if [ -z "$DATE_PART" ]; then
    print_warning "Could not extract date from filename, using current date"
    DATE_PART=$(date +%m%d%Y)
fi

# Set output files in scripts directory
CSV_FILE="$(pwd)/tariff_database_2025_${DATE_PART}.csv"
JSON_FILE="$(pwd)/tariff_processed_${DATE_PART}.json"

print_status "Starting tariff data processing..."
print_status "Excel file: $EXCEL_FILE"
print_status "HTS Revision: $REVISION"
print_status "CSV output: $CSV_FILE"
print_status "JSON output: $JSON_FILE"

# Step 1: Convert Excel to CSV
if [ -f "$EXCEL_FILE" ]; then
    print_status "Converting Excel to CSV..."
    python3 "$SCRIPT_DIR/excel_to_csv.py" "$EXCEL_FILE" "$CSV_FILE"

    if [ $? -ne 0 ]; then
        print_error "Failed to convert Excel to CSV"
        cd "$ORIGINAL_DIR"
        exit 1
    fi
    print_status "✓ CSV conversion complete"
else
    print_error "Excel file not found: $EXCEL_FILE"
    cd "$ORIGINAL_DIR"
    exit 1
fi

# Step 2: Process tariff data with revision
if [ -f "$CSV_FILE" ]; then
    print_status "Processing tariff data with revision: $REVISION"
    python3 "$SCRIPT_DIR/preprocess_tariff_data.py" "$CSV_FILE" "$JSON_FILE" "$REVISION"

    if [ $? -ne 0 ]; then
        print_error "Failed to process tariff data"
        cd "$ORIGINAL_DIR"
        exit 1
    fi
    print_status "✓ Tariff data processing complete"
else
    print_error "CSV file not found: $CSV_FILE"
    cd "$ORIGINAL_DIR"
    exit 1
fi

# Step 3: Generate segments
if [ -f "$JSON_FILE" ]; then
    print_status "Generating segment files..."

    # Create segments directory if it doesn't exist
    mkdir -p "$SCRIPT_DIR/data/tariff-segments"

    node "$SCRIPT_DIR/segment-tariff-data.js" "$JSON_FILE"

    if [ $? -ne 0 ]; then
        print_error "Failed to generate segments"
        cd "$ORIGINAL_DIR"
        exit 1
    fi
    print_status "✓ Segment generation complete"

    # Count generated files
    SEGMENT_COUNT=$(ls -1 "$SCRIPT_DIR/data/tariff-segments/" 2>/dev/null | wc -l)
    print_status "Generated $SEGMENT_COUNT segment files"

    # --- Optional: Automatically upload processed files to Azure Blob Storage ---
    if command -v az >/dev/null 2>&1; then
      print_status "Uploading processed JSON to Azure…"
      az storage blob upload \
        --account-name "$ACCOUNT_NAME" \
        --container-name "$CONTAINER_NAME" \
        --auth-mode login \
        --file "$JSON_FILE" \
        --name "$DEST_PATH/$(basename "$JSON_FILE")" \
        --overwrite true || print_warning "Failed to upload processed JSON"

      print_status "Uploading segment files to Azure (this may take a while)…"
      az storage blob upload-batch \
        --account-name "$ACCOUNT_NAME" \
        --auth-mode login \
        --destination "$CONTAINER_NAME/$DEST_PATH/tariff-segments" \
        --source "$SCRIPT_DIR/data/tariff-segments" \
        --overwrite true \
        --no-progress || print_warning "Failed to upload segment files"
    else
      print_warning "Azure CLI (az) not found. Skipping automatic upload. Install Azure CLI or upload manually."
    fi
else
    print_error "JSON file not found: $JSON_FILE"
    cd "$ORIGINAL_DIR"
    exit 1
fi

# Return to original directory
cd "$ORIGINAL_DIR"

# Summary
echo ""
print_status "=== Processing Complete ==="
print_status "Processed files:"
print_status "  - CSV: $CSV_FILE"
print_status "  - JSON: $JSON_FILE"
print_status "  - Segments: $SCRIPT_DIR/data/tariff-segments/"
print_status "  - HTS Revision: $REVISION"
echo ""
print_status "File sizes:"
ls -lh "$JSON_FILE" | awk '{print "  - JSON: " $5}'
echo ""
print_status "Next steps:"
print_status "  1. Upload $(basename "$JSON_FILE") to Azure Blob Storage"
print_status "  2. Upload all files from $SCRIPT_DIR/data/tariff-segments/ to Azure"
print_status "  3. The app will show: 'HTS $REVISION'"
echo ""
print_status "You are now back in: $(pwd)"
