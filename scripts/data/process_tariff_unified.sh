#!/bin/bash

# Unified Tariff Data Processing Script
# This script can process either ALL tariff entries or ONLY Section 301 entries
# It can also extract Section 301 data from PDFs if needed
# Usage: ./process_tariff_unified.sh <excel-file> [options]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Default values
FILTER_SECTION_301=false
EXTRACT_SECTION_301=false
REVISION=""
EXCEL_INPUT=""

# Function to show usage
show_usage() {
    echo "Usage: $0 <excel-file> [options]"
    echo ""
    echo "Required:"
    echo "  <excel-file>              Path to tariff Excel file"
    echo ""
    echo "Options:"
    echo "  --section-301-only        Process ONLY HTS codes with Section 301 tariffs"
    echo "  --extract-301 <pdf>       Extract Section 301 data from PDF first"
    echo "  --revision <number>       Override HTS revision number"
    echo "  --help                    Show this help message"
    echo ""
    echo "Examples:"
    echo "  # Process all tariff entries:"
    echo "  $0 tariff_database_2025_07_01_R16.xlsx"
    echo ""
    echo "  # Process only Section 301 entries:"
    echo "  $0 tariff_database_2025_07_01_R16.xlsx --section-301-only"
    echo ""
    echo "  # Extract Section 301 from PDF, then process:"
    echo "  $0 tariff_database_2025_07_01_R16.xlsx --extract-301 'List 1.pdf' --section-301-only"
    echo ""
    exit 1
}

# Parse command line arguments
if [ $# -lt 1 ]; then
    show_usage
fi

EXCEL_INPUT="$1"
shift

# Parse optional arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --section-301-only)
            FILTER_SECTION_301=true
            shift
            ;;
        --extract-301)
            EXTRACT_SECTION_301=true
            PDF_FILE="$2"
            shift 2
            ;;
        --revision)
            REVISION="$2"
            shift 2
            ;;
        --help)
            show_usage
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            ;;
    esac
done

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

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

# Step 0: Extract Section 301 data if requested
if [ "$EXTRACT_SECTION_301" = true ]; then
    print_info "=== Section 301 Extraction ==="
    
    if [ ! -f "$PDF_FILE" ] && [ ! -f "$ORIGINAL_DIR/$PDF_FILE" ]; then
        print_error "PDF file not found: $PDF_FILE"
        cd "$ORIGINAL_DIR"
        exit 1
    fi
    
    # Check if PDF exists in original directory
    if [ -f "$ORIGINAL_DIR/$PDF_FILE" ]; then
        PDF_FILE="$ORIGINAL_DIR/$PDF_FILE"
    fi
    
    print_status "Extracting Section 301 data from: $PDF_FILE"
    
    # Create exports directory if it doesn't exist
    mkdir -p "$SCRIPT_DIR/../exports"
    
    # Run extraction script
    if command -v python3 >/dev/null 2>&1; then
        python3 "$SCRIPT_DIR/extract_section301_from_pdf.py" "$PDF_FILE"
        
        if [ $? -ne 0 ]; then
            print_error "Failed to extract Section 301 data"
            cd "$ORIGINAL_DIR"
            exit 1
        fi
        
        # Run deduplication
        print_status "Deduplicating Section 301 data..."
        (cd "$SCRIPT_DIR/.." && python3 deduplicate_section301.py)
        
        if [ $? -ne 0 ]; then
            print_error "Failed to deduplicate Section 301 data"
            cd "$ORIGINAL_DIR"
            exit 1
        fi
        
        print_status "✓ Section 301 extraction complete"
    else
        print_error "Python 3 is required for Section 301 extraction"
        cd "$ORIGINAL_DIR"
        exit 1
    fi
    echo ""
fi

# Check for Section 301 data if filtering is requested
if [ "$FILTER_SECTION_301" = true ]; then
    SECTION_301_CSV="$SCRIPT_DIR/../exports/section301_deduplicated.csv"
    if [ ! -f "$SECTION_301_CSV" ]; then
        print_error "Section 301 deduplicated CSV not found at: $SECTION_301_CSV"
        print_error "Please run with --extract-301 option or run extraction scripts first"
        cd "$ORIGINAL_DIR"
        exit 1
    fi
fi

# Handle different input path formats for Excel file
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
    cd "$ORIGINAL_DIR"
    exit 1
fi

# Extract date and revision from filename
FILENAME=$(basename "$EXCEL_FILE")

# Extract date part (MM_DD)
DATE_PART=$(echo "$FILENAME" | sed -n 's/.*2025_\([0-9][0-9]_[0-9][0-9]\).*/\1/p')
if [ -z "$DATE_PART" ]; then
    print_warning "Could not extract date from filename, using current date"
    DATE_PART=$(date +%m_%d)
fi

# Convert MM_DD to MMDDYYYY format
MONTH=$(echo "$DATE_PART" | cut -d'_' -f1)
DAY=$(echo "$DATE_PART" | cut -d'_' -f2)
YEAR="2025"
DATE_FORMATTED="${MONTH}${DAY}${YEAR}"

# Extract revision from filename if not provided
if [ -z "$REVISION" ]; then
    REVISION_FROM_FILE=$(echo "$FILENAME" | grep -oE 'R[0-9]+' | grep -oE '[0-9]+')
    if [ -n "$REVISION_FROM_FILE" ]; then
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
fi

# Set output files based on mode
if [ "$FILTER_SECTION_301" = true ]; then
    CSV_FILE="$(pwd)/tariff_database_2025_${DATE_FORMATTED}.csv"
    JSON_FILE="$(pwd)/tariff_processed_${DATE_FORMATTED}_R${REVISION}.json"
    MODE_DESC="Section 301 ONLY"
else
    CSV_FILE="$(pwd)/tariff_database_2025_${DATE_FORMATTED}_all.csv"
    JSON_FILE="$(pwd)/tariff_processed_${DATE_FORMATTED}_R${REVISION}_all.json"
    MODE_DESC="ALL entries"
fi

print_info "=== Tariff Data Processing ==="
print_status "Mode: $MODE_DESC"
print_status "Excel file: $EXCEL_FILE"
print_status "Detected date: $DATE_PART (formatted as $DATE_FORMATTED)"
print_status "HTS Revision: $REVISION"
print_status "CSV output: $CSV_FILE"
print_status "JSON output: $JSON_FILE"

# Step 1: Convert Excel to CSV
print_info "Converting Excel to CSV..."
python3 "$SCRIPT_DIR/excel_to_csv.py" "$EXCEL_FILE" "$CSV_FILE"

if [ $? -ne 0 ]; then
    print_error "Failed to convert Excel to CSV"
    cd "$ORIGINAL_DIR"
    exit 1
fi
print_status "✓ CSV conversion complete"

# Step 2: Process tariff data
if [ "$FILTER_SECTION_301" = true ]; then
    print_info "Processing tariff data with Section 301 filtering..."
    print_status "Integrating Section 301 data from: $SECTION_301_CSV"
    print_status "Filtering to ONLY HTS codes with Section 301 add-ons..."
    
    python3 "$SCRIPT_DIR/preprocess_tariff_data_new.py" \
        "$CSV_FILE" "$SECTION_301_CSV" "$JSON_FILE" "$REVISION" --inject-extra-tariffs
else
    print_info "Processing ALL tariff data..."
    
    # Use the existing Section 301 deduplicated CSV
    SECTION_301_CSV="$SCRIPT_DIR/../exports/section301_deduplicated.csv"
    if [ ! -f "$SECTION_301_CSV" ]; then
        print_warning "Section 301 deduplicated CSV not found. Section 301 rates may be incorrect."
        print_warning "Run with --extract-301 option first to ensure correct rates."
    else
        print_status "Using Section 301 data from: $SECTION_301_CSV"
    fi
    
    python3 "$SCRIPT_DIR/preprocess_tariff_data_new.py" \
        "$CSV_FILE" "$SECTION_301_CSV" "$JSON_FILE" "$REVISION" --inject-extra-tariffs
fi

if [ $? -ne 0 ]; then
    print_error "Failed to process tariff data"
    cd "$ORIGINAL_DIR"
    exit 1
fi
print_status "✓ Tariff data processing complete"

# Step 3: Generate segments
print_info "Generating segment files..."

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
SEGMENT_COUNT=$(ls -1 "$SCRIPT_DIR/tariff-segments/tariff-*.json" 2>/dev/null | wc -l)
print_status "Generated $SEGMENT_COUNT segment files"

# Step 4: Optional Azure upload
if command -v az >/dev/null 2>&1; then
    read -p "Upload segment files to Azure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Uploading segment files to Azure..."
        az storage blob upload-batch \
            --account-name "$ACCOUNT_NAME" \
            --auth-mode login \
            --destination "$CONTAINER_NAME/$DEST_PATH/tariff-segments" \
            --source "$SCRIPT_DIR/tariff-segments" \
            --overwrite true \
            --no-progress || print_warning "Failed to upload segment files"
    else
        print_status "Skipping Azure upload"
    fi
else
    print_warning "Azure CLI not found. Install Azure CLI or upload manually."
fi

# Return to original directory
cd "$ORIGINAL_DIR"

# Summary
echo ""
print_info "=== Processing Complete ==="
if [ "$FILTER_SECTION_301" = true ]; then
    print_status "Dataset contains ONLY HTS codes with Section 301 add-ons"
else
    print_status "Dataset contains ALL HTS codes"
fi
echo ""
print_status "Processed files:"
print_status "  - CSV: $CSV_FILE"
if [ "$FILTER_SECTION_301" = true ]; then
    print_status "  - Section 301 CSV: $SECTION_301_CSV"
fi
print_status "  - JSON: $JSON_FILE"
print_status "  - Segments: $SCRIPT_DIR/tariff-segments/"
print_status "  - HTS Revision: $REVISION"
echo ""

# File sizes
print_status "File sizes:"
ls -lh "$JSON_FILE" | awk '{print "  - JSON: " $5}'
echo ""

# Count entries
ENTRY_COUNT=$(grep -c '"hts8"' "$JSON_FILE" 2>/dev/null || echo "0")
if [ "$FILTER_SECTION_301" = true ]; then
    print_status "Section 301 HTS codes processed: $ENTRY_COUNT"
else
    print_status "Total HTS codes processed: $ENTRY_COUNT"
fi

echo ""
print_status "You are now back in: $(pwd)" 