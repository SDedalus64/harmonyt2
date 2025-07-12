#!/bin/bash

# Tariff Data Processing Script with Section 301 Integration
# This script automates the complete tariff data processing workflow
# It processes ONLY HTS codes with Section 301 add-ons for HarmonyTi
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
    print_error "Please ensure preprocess_tariff_data.py exists in the scripts/data directory"
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

# Activate virtual environment if it exists
VENV_PATH="$SCRIPT_DIR/../../venv_tariff"
if [ -d "$VENV_PATH" ]; then
    print_status "Activating virtual environment..."
    source "$VENV_PATH/bin/activate"
else
    print_warning "Virtual environment not found at $VENV_PATH"
    print_warning "You may need to install dependencies: pip install pandas openpyxl pdfplumber"
fi

# Check for Section 301 deduplicated CSV
SECTION_301_CSV="$SCRIPT_DIR/../exports/section301_deduplicated.csv"
if [[ ! -f "$SECTION_301_CSV" ]]; then
    print_error "Section 301 deduplicated CSV not found at: $SECTION_301_CSV"
    print_error "Please run the Section 301 extraction scripts first"
    exit 1
fi

# Check arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <excel-file> [revision-number]"
    echo "Example: $0 data/tariff_data_2025/tariff_database_2025_07_01_R16.xlsx"
    echo ""
    echo "The excel-file path can be:"
    echo "  - Relative to current directory: data/tariff_data_2025/tariff_database_2025_07_01_R16.xlsx"
    echo "  - Relative to scripts directory: ../data/tariff_data_2025/tariff_database_2025_07_01_R16.xlsx"
    echo "  - Absolute path: /Users/you/harmonyt2/scripts/data/tariff_data_2025/tariff_database_2025_07_01_R16.xlsx"
    echo ""
    echo "Expected filename format: tariff_database_2025_MM_DD_R##.xlsx"
    echo "  where MM_DD is the date and R## is the revision number (e.g., R16)"
    echo ""
    echo "This script will:"
    echo "  1. Convert Excel to CSV"
    echo "  2. Process tariff data with Section 301 integration"
    echo "  3. Filter to ONLY HTS codes with Section 301 add-ons"
    echo "  4. Generate segment files"
    echo ""
    echo "Prerequisites:"
    echo "  - Section 301 deduplicated CSV must exist at: ../exports/section301_deduplicated.csv"
    exit 1
fi

EXCEL_INPUT="$1"

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

# Extract date and revision from filename (format: tariff_database_2025_MM_DD_R##.xlsx)
FILENAME=$(basename "$EXCEL_FILE")

# Extract date part (MM_DD) - specifically after the year
DATE_PART=$(echo "$FILENAME" | sed -n 's/.*2025_\([0-9][0-9]_[0-9][0-9]\).*/\1/p')
if [ -z "$DATE_PART" ]; then
    print_warning "Could not extract date from filename, using current date"
    DATE_PART=$(date +%m_%d)
fi

# Convert MM_DD to MMDDYYYY format for backwards compatibility
MONTH=$(echo "$DATE_PART" | cut -d'_' -f1)
DAY=$(echo "$DATE_PART" | cut -d'_' -f2)
YEAR="2025"
DATE_FORMATTED="${MONTH}${DAY}${YEAR}"

# Extract revision number from filename (R##)
REVISION_FROM_FILE=$(echo "$FILENAME" | grep -oE 'R[0-9]+' | grep -oE '[0-9]+')

# If revision provided as argument, use it; otherwise use from filename
if [ $# -ge 2 ]; then
    REVISION="$2"
    print_warning "Using revision $REVISION from command line (overriding R$REVISION_FROM_FILE from filename)"
elif [ -n "$REVISION_FROM_FILE" ]; then
    REVISION="$REVISION_FROM_FILE"
    print_status "Using revision $REVISION from filename"
else
    echo ""
    read -p "Enter the HTS revision number (e.g., 14, 15, 16): " REVISION
    if [ -z "$REVISION" ]; then
        print_error "Revision number cannot be empty"
        cd "$ORIGINAL_DIR"
        exit 1
    fi
fi

# Set output files in scripts directory
CSV_FILE="$(pwd)/tariff_database_2025_${DATE_FORMATTED}.csv"
JSON_FILE="$(pwd)/tariff_processed_${DATE_FORMATTED}_R${REVISION}.json"

print_status "Starting tariff data processing..."
print_status "Excel file: $EXCEL_FILE"
print_status "Detected date: $DATE_PART (formatted as $DATE_FORMATTED)"
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

# Step 2: Process tariff data with revision and Section 301 integration
if [ -f "$CSV_FILE" ]; then
    print_status "Processing tariff data with revision: $REVISION"
    print_status "Integrating Section 301 data from: $SECTION_301_CSV"
    print_status "Filtering to ONLY HTS codes with Section 301 add-ons..."
    
    python3 "$SCRIPT_DIR/preprocess_tariff_data_new.py" "$CSV_FILE" "$SECTION_301_CSV" "$JSON_FILE" "$REVISION" --inject-extra-tariffs

    if [ $? -ne 0 ]; then
        print_error "Failed to process tariff data"
        cd "$ORIGINAL_DIR"
        exit 1
    fi
    print_status "✓ Tariff data processing complete"
    print_status "✓ Only Section 301 affected HTS codes included"
else
    print_error "CSV file not found: $CSV_FILE"
    cd "$ORIGINAL_DIR"
    exit 1
fi

# Step 3: Generate segments
if [ -f "$JSON_FILE" ]; then
    print_status "Generating segment files..."

    # Create segments directory if it doesn't exist
    mkdir -p "$SCRIPT_DIR/tariff-segments"

    node "$SCRIPT_DIR/segment-tariff-data.js" "$JSON_FILE"

    if [ $? -ne 0 ]; then
        print_error "Failed to generate segments"
        cd "$ORIGINAL_DIR"
        exit 1
    fi
    print_status "✓ Segment generation complete"

    # Count generated files
    SEGMENT_COUNT=$(ls -1 "$SCRIPT_DIR/tariff-segments/" 2>/dev/null | wc -l)
    print_status "Generated $SEGMENT_COUNT segment files"

    # --- Optional: Automatically upload segment files to Azure Blob Storage ---
    if command -v az >/dev/null 2>&1; then
      # Skip uploading the main JSON file - not needed with segmented architecture
      # print_status "Uploading processed JSON to Azure…"
      # az storage blob upload \
      #   --account-name "$ACCOUNT_NAME" \
      #   --container-name "$CONTAINER_NAME" \
      #   --auth-mode login \
      #   --file "$JSON_FILE" \
      #   --name "$DEST_PATH/$(basename "$JSON_FILE")" \
      #   --overwrite true || print_warning "Failed to upload processed JSON"

      print_status "Uploading segment files to Azure (this may take a while)…"
      az storage blob upload-batch \
        --account-name "$ACCOUNT_NAME" \
        --auth-mode login \
        --destination "$CONTAINER_NAME/$DEST_PATH/tariff-segments" \
        --source "$SCRIPT_DIR/tariff-segments" \
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
print_status "IMPORTANT: This dataset contains ONLY HTS codes with Section 301 add-ons"
print_status ""
print_status "Processed files:"
print_status "  - CSV: $CSV_FILE"
print_status "  - Section 301 CSV: $SECTION_301_CSV"
print_status "  - JSON: $JSON_FILE (Section 301 only)"
print_status "  - Segments: $SCRIPT_DIR/tariff-segments/"
print_status "  - HTS Revision: $REVISION"
print_status "  - Date: $DATE_PART"
echo ""
print_status "File sizes:"
ls -lh "$JSON_FILE" | awk '{print "  - JSON: " $5}'
echo ""

# Count Section 301 entries
ENTRY_COUNT=$(grep -c '"hts8"' "$JSON_FILE" 2>/dev/null || echo "0")
print_status "Section 301 HTS codes processed: $ENTRY_COUNT"

echo ""
print_status "Next steps:"
print_status "  1. Verify segment files were uploaded to Azure"
print_status "  2. The app will show: 'HTS Rev. $REVISION' with Section 301 data"
print_status "  3. Only HTS codes with Section 301 tariffs will appear in HarmonyTi"
echo ""
print_status "You are now back in: $(pwd)"
