#!/bin/bash

# Simple Tariff Update Script
# Just run: ./update_tariffs

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR" || exit 1

echo -e "${GREEN}=== Harmony Tariff Update Tool ===${NC}"
echo ""

# Find the latest CSV file
LATEST_CSV=$(ls -t tariff_database_*.csv 2>/dev/null | head -1)

if [ -z "$LATEST_CSV" ]; then
    echo -e "${RED}No tariff CSV files found in $SCRIPT_DIR${NC}"
    echo "Please place your tariff_database_YYYY_MMDDYYYY.csv file in the scripts directory"
    exit 1
fi

echo -e "${GREEN}Found CSV file:${NC} $LATEST_CSV"

# Extract date from filename
DATE_PART=$(echo "$LATEST_CSV" | grep -oE '[0-9]{8}' | tail -1)
if [ -z "$DATE_PART" ]; then
    DATE_PART=$(date +%m%d%Y)
fi

# Check if there's a Change Record PDF
CHANGE_RECORD=$(ls -t data/Change*Record*.pdf 2>/dev/null | head -1)
if [ -n "$CHANGE_RECORD" ]; then
    echo -e "${GREEN}Found Change Record:${NC} $CHANGE_RECORD"
    echo ""
    echo "Please check the Change Record PDF for the HTS revision number."
    echo "Look for patterns like: 'HTS 2025 Revision 14'"
else
    echo ""
    echo -e "${YELLOW}No Change Record PDF found in data/ directory${NC}"
fi

echo ""
read -p "Enter the HTS revision number (e.g., 14): " REVISION_NUM

if [ -z "$REVISION_NUM" ]; then
    echo -e "${RED}Revision number is required!${NC}"
    exit 1
fi

REVISION="Revision $REVISION_NUM"
JSON_FILE="tariff_processed_${DATE_PART}.json"

echo ""
echo -e "${GREEN}Processing with HTS $REVISION...${NC}"

# Process the tariff data
echo "• Processing tariff data..."
python3 preprocess_tariff_data.py "$LATEST_CSV" "$JSON_FILE" "$REVISION"

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to process tariff data${NC}"
    exit 1
fi

# Generate segments
echo "• Generating segments..."
mkdir -p data/tariff-segments
node segment-tariff-data.js "$JSON_FILE"

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to generate segments${NC}"
    exit 1
fi

# Count files
SEGMENT_COUNT=$(ls -1 data/tariff-segments/*.json 2>/dev/null | wc -l)

echo ""
echo -e "${GREEN}✓ Success!${NC}"
echo ""
echo "Processed files:"
echo "  • JSON: $JSON_FILE ($(ls -lh "$JSON_FILE" | awk '{print $5}'))"
echo "  • Segments: $SEGMENT_COUNT files in data/tariff-segments/"
echo "  • HTS Version: $REVISION"
echo ""
echo "Next steps:"
echo "  1. Upload $JSON_FILE to Azure Blob Storage"
echo "  2. Upload all files from data/tariff-segments/ to Azure"
echo ""
echo -e "${GREEN}The app will now show: 'HTS $REVISION'${NC}"
