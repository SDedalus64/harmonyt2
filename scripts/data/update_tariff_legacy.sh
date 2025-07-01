#!/bin/bash

# Script to update tariff data and regenerate segments
# Usage: ./update-tariff-data.sh

echo "🔄 Starting tariff data update process..."

# Check if CSV file exists
CSV_FILE="scripts/data/tariff_database_2025_06062025.csv"
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Error: CSV file not found at $CSV_FILE"
    echo "Please ensure the tariff CSV file is in the scripts directory"
    exit 1
fi

# Create data directory if it doesn't exist
mkdir -p scripts/data

# Extract date from CSV filename (assumes format tariff_database_2025_MMDDYYYY.csv)
DATE_STAMP=$(echo "$CSV_FILE" | grep -o '[0-9]\{8\}' | tail -1)
if [ -z "$DATE_STAMP" ]; then
    echo "⚠️  Warning: Could not extract date from CSV filename, using today's date"
    DATE_STAMP=$(date +%m%d%Y)
fi

OUTPUT_JSON="scripts/data/tariff_processed_${DATE_STAMP}.json"

# Step 1: Process the CSV to create tariff_processed.json
echo "📊 Processing tariff CSV data..."
echo "📅 Using date stamp: $DATE_STAMP"
python3 scripts/preprocess_tariff_data.py "$CSV_FILE" "$OUTPUT_JSON"

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to process tariff data"
    exit 1
fi

echo "✅ Successfully created $OUTPUT_JSON"

# Step 2: Generate segmented JSON files
echo "🔪 Segmenting tariff data..."
# Pass the datestamped filename to the segmentation script
node scripts/segment-tariff-data.js "$OUTPUT_JSON"

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to segment tariff data"
    exit 1
fi

echo "✅ Successfully created segmented tariff files"

# Step 3: Verify the segments
echo "🔍 Verifying segments..."
node scripts/verify-segments.js "$OUTPUT_JSON"

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Segment verification reported issues"
    echo "Please check the output above"
else
    echo "✅ Segment verification passed"
fi

# Step 4: Show summary
echo ""
echo "📈 Update Summary:"
echo "==================="
echo "1. Main file: $OUTPUT_JSON"
echo "2. Segments: scripts/data/tariff-segments/*.json"
echo "3. Index: scripts/data/tariff-segments/segment-index.json"
echo ""

# Count files
SEGMENT_COUNT=$(ls -1 scripts/data/tariff-segments/tariff-*.json 2>/dev/null | wc -l)
echo "Total segment files created: $SEGMENT_COUNT"

# Show file sizes
echo ""
echo "File sizes:"
ls -lh "$OUTPUT_JSON"
echo "Segments total:"
du -sh scripts/data/tariff-segments/

echo ""
echo "✅ Tariff data update complete!"
echo ""
echo "📤 IMPORTANT: Upload the generated files to Azure Blob Storage:"
echo "   1. Main file: $OUTPUT_JSON"
echo "   2. Upload to: https://cs410033fffad325ccb.blob.core.windows.net/\$web/TCalc/data/"
echo "   3. Rename to: tariff_processed_${DATE_STAMP}.json (should match the filename)"
echo ""
echo "📝 Don't forget to update src/config/azure.config.ts with the new filename:"
echo "   mainDataFile: 'tariff_processed_${DATE_STAMP}.json'"
echo ""
echo "Next steps:"
echo "1. Upload the JSON file to Azure Blob Storage"
echo "2. Update azure.config.ts with the new filename"
echo "3. Test the app to ensure tariff lookups work correctly"
echo "4. Commit the updated files to git"
echo "5. Deploy the updated app"
