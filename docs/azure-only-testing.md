# Azure-Only Performance Testing Guide

## Changes Made

✅ **Removed Local Data**
- Deleted `src/data (local copy)/` directory (50MB+ of JSON files)
- Removed `tariff_processed.json` (49MB)
- Removed all tariff segment files (1MB+ each)

✅ **Disabled Preloading**
- Removed tariff data preloading from `App.tsx`
- App now starts immediately without waiting for data
- Data loads on-demand during first lookup

✅ **Pure Azure Implementation**
- TariffService now exclusively uses Azure Blob Storage
- Enhanced logging with performance metrics
- Better error handling for network issues

## Testing Commands

```bash
# Clear Metro cache and start fresh
npx expo start --clear

# Alternative: Clear everything
npx expo start --clear --reset-cache
```

## Expected Performance Characteristics

### App Startup
- **Before**: 2-5 seconds (preloading 50MB data)
- **After**: <1 second (no preloading)

### First Lookup
- **Expected**: 1-3 seconds (Azure fetch + parsing)
- **Watch for**: Console logs showing Azure loading time

### Subsequent Lookups
- **Expected**: <500ms (cached data)
- **Watch for**: "Tariff data already loaded and cached" message

## Console Logs to Watch For

### Successful Azure Loading
```
🚀 Loading tariff data from Azure Blob Storage (no local fallback)...
📡 Fetching from: https://cs410033fffad325ccb.blob.core.windows.net/$web/TCalc/data/...
✅ Successfully loaded tariff data from Azure
⏱️  Load time: 1234ms
📊 Total tariff entries loaded: 12345
📅 Data last updated: 2024-XX-XX
```

### Cached Data Usage
```
📦 Tariff data already loaded and cached
```

### Error Scenarios
```
❌ Failed to initialize tariff data after 5000ms: Network error
```

## Performance Testing Steps

1. **Fresh Start Test**
   - Close app completely
   - Clear Metro cache: `npx expo start --clear`
   - Launch app
   - Measure startup time (should be <1 second)

2. **First Lookup Test**
   - Enter HTS code (e.g., 84715001)
   - Select country (e.g., China)
   - Enter value (e.g., 1000)
   - Click Search
   - Measure time to results (1-3 seconds expected)
   - Check console for Azure loading logs

3. **Cached Lookup Test**
   - Perform another lookup immediately
   - Should be much faster (<500ms)
   - Check console for "already loaded and cached" message

4. **Network Failure Test**
   - Turn off internet
   - Try fresh app start + lookup
   - Should show appropriate error message

## Bundle Size Verification

```bash
# Check src directory size (should be much smaller now)
du -sh src/

# Check for any remaining large files
find src/ -type f -size +1M

# The largest files should now be images/assets, not JSON data
```

## Success Criteria

✅ App starts in <1 second
✅ First lookup completes in 1-3 seconds
✅ Subsequent lookups are <500ms
✅ Console shows Azure loading metrics
✅ No local JSON files in bundle
✅ Proper error handling for network issues
✅ All existing functionality preserved

## Troubleshooting

### If Azure loading fails:
1. Check internet connection
2. Verify Azure blob URLs in console
3. Check for CORS issues
4. Verify Azure blob storage is accessible

### If app crashes:
1. Check for missing imports after removing local data
2. Verify TariffService initialization
3. Check console for specific error messages

### If performance is poor:
1. Check network speed
2. Verify caching is working (subsequent lookups should be fast)
3. Monitor console for repeated Azure fetches (should only happen once)
