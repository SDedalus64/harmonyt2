#!/bin/bash

# Script to update tariff data and regenerate segments
# Usage: ./update-tariff-data.sh

echo "🔄 Starting tariff data update process..."

# Check if CSV file exists
CSV_FILE="scripts/tariff_database_2025.csv"
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Error: CSV file not found at $CSV_FILE"
    echo "Please ensure the tariff CSV file is in the scripts directory"
    exit 1
fi

# Step 1: Process the CSV to create tariff_processed.json
echo "📊 Processing tariff CSV data..."
python3 scripts/preprocess_tariff_data.py "$CSV_FILE" src/data/tariff_processed.json

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to process tariff data"
    exit 1
fi

echo "✅ Successfully created tariff_processed.json"

# Step 2: Generate segmented JSON files
echo "🔪 Segmenting tariff data..."
node scripts/segment-tariff-data.js

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to segment tariff data"
    exit 1
fi

echo "✅ Successfully created segmented tariff files"

# Step 3: Verify the segments
echo "🔍 Verifying segments..."
node scripts/verify-segments.js

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
echo "1. Main file: src/data/tariff_processed.json"
echo "2. Segments: src/data/tariff-segments/*.json"
echo "3. Index: src/data/tariff-segments/segment-index.json"
echo ""

# Count files
SEGMENT_COUNT=$(ls -1 src/data/tariff-segments/tariff-*.json 2>/dev/null | wc -l)
echo "Total segment files created: $SEGMENT_COUNT"

# Show file sizes
echo ""
echo "File sizes:"
ls -lh src/data/tariff_processed.json
echo "Segments total:"
du -sh src/data/tariff-segments/

echo ""
echo "✅ Tariff data update complete!"
echo ""
echo "Next steps:"
echo "1. Test the app to ensure tariff lookups work correctly"
echo "2. Commit the updated files to git"
echo "3. Deploy the updated app"
