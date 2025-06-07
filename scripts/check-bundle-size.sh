#!/bin/bash

# Check bundle size after removing local tariff data
echo "🔍 Checking bundle size without local tariff data..."

# Check if the local data directory was removed
if [ ! -d "src/data (local copy)" ]; then
    echo "✅ Local tariff data directory removed successfully"
else
    echo "⚠️  Local tariff data directory still exists"
fi

# Check current project size
echo ""
echo "📊 Current project size breakdown:"
echo "Total src/ directory:"
du -sh src/ 2>/dev/null || echo "Could not calculate src/ size"

echo ""
echo "Largest files in src/:"
find src/ -type f -size +1M -exec ls -lh {} \; 2>/dev/null | head -10

echo ""
echo "🚀 Ready to test Azure-only performance!"
echo ""
echo "To test the app:"
echo "1. npx expo start --clear"
echo "2. Test first lookup performance (should show Azure loading)"
echo "3. Test subsequent lookups (should use cached data)"
echo ""
echo "Expected behavior:"
echo "- App starts faster (no preloading)"
echo "- First lookup takes longer (Azure fetch)"
echo "- Subsequent lookups are fast (cached)"
echo "- Much smaller bundle size"
