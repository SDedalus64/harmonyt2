# Simulator Test Guide - Azure-Only Implementation

## 🚀 Quick Start Commands

**Terminal 1 - Start Expo Server:**
```bash
cd /Users/sdedola/Harmony
npx expo start --clear
```

**Terminal 2 - Launch iOS Simulator:**
```bash
cd /Users/sdedola/Harmony
npx expo run:ios
```

## 📊 Performance Test Script

Run this to verify bundle optimization:
```bash
node scripts/performance-test.js
```

## 🧪 Testing Sequence

### 1. **App Startup Test**
- **Goal**: Verify <1 second startup (no preloading)
- **Steps**:
  1. Close app completely if running
  2. Launch from simulator
  3. Time from tap to UI display
- **Expected**: Immediate startup, no loading spinner
- **Watch for**: No "Preloading tariff data..." message

### 2. **First Azure Lookup Test**
- **Goal**: Test Azure blob storage loading
- **Steps**:
  1. Enter HTS code: `84715001`
  2. Select country: `China`
  3. Enter value: `1000`
  4. Tap Search
  5. Monitor console logs
- **Expected**: 1-3 seconds, Azure loading logs
- **Console logs to watch for**:
  ```
  🚀 Loading tariff data from Azure Blob Storage (no local fallback)...
  📡 Fetching from: https://harmonytariff.blob.core.windows.net/...
  ✅ Successfully loaded tariff data from Azure
  ⏱️  Load time: XXXXms
  📊 Total tariff entries loaded: XXXXX
  ```

### 3. **Cached Lookup Test**
- **Goal**: Verify caching works properly
- **Steps**:
  1. Immediately perform another lookup
  2. Use HTS code: `61091000`
  3. Select country: `Mexico`
  4. Enter value: `500`
  5. Tap Search
- **Expected**: <500ms response
- **Console logs to watch for**:
  ```
  📦 Tariff data already loaded and cached
  ```

### 4. **New UI Features Test**
- **Goal**: Test the elegant drawer interface
- **Steps**:
  1. Tap bottom FAB (blue) - History drawer
  2. Tap right FAB (orange) - News drawer
  3. Tap left FAB (green) - Analytics drawer
  4. Test swipe-to-dismiss on each drawer
- **Expected**: Smooth animations, proper gesture handling

### 5. **Network Error Test**
- **Goal**: Test error handling
- **Steps**:
  1. Turn off WiFi/cellular
  2. Force close app
  3. Relaunch and try lookup
- **Expected**: Proper error message, no crash

## 📱 Test HTS Codes

| HTS Code | Country | Description | Expected Duty |
|----------|---------|-------------|---------------|
| 84715001 | China | Laptop | High (Section 301) |
| 61091000 | Mexico | T-shirt | Low (USMCA) |
| 87032310 | Canada | Car engine | Medium |
| 85171100 | South Korea | Phone | Medium |
| 94036000 | Vietnam | Furniture | Low |

## 🎯 Success Criteria

### ✅ Performance Metrics
- [ ] App startup: <1 second
- [ ] First lookup: 1-3 seconds
- [ ] Cached lookup: <500ms
- [ ] Bundle size: 50MB+ smaller
- [ ] Memory usage: Lower

### ✅ Functionality
- [ ] All lookups work correctly
- [ ] History navigation works
- [ ] Country selection works
- [ ] Reciprocal tariff toggle works
- [ ] Unit calculations work
- [ ] New drawer UI works

### ✅ Console Logs
- [ ] Azure loading messages appear
- [ ] Load times are displayed
- [ ] Cache hit messages appear
- [ ] No error messages
- [ ] No local data references

## 🔧 Troubleshooting

### App Won't Start
```bash
# Clear everything and restart
npx expo start --clear --reset-cache
```

### Azure Loading Fails
1. Check internet connection
2. Verify Azure URLs in console
3. Test Azure endpoint: https://harmonytariff.blob.core.windows.net/tariff-data/tariff_processed.json

### Performance Issues
1. Check network speed
2. Verify no local data remains: `ls -la src/`
3. Check for large files: `find src/ -type f -size +1M`

### Simulator Issues
```bash
# Reset iOS simulator
npx expo run:ios --clear

# Or manually reset in Simulator menu:
# Device > Erase All Content and Settings
```

## 📊 Expected Console Output

### Successful Test Run:
```
App initializing without tariff data preloading...
App initialization complete - tariff data will load on first lookup
🔄 Initializing tariff service for on-demand Azure loading...
🚀 Loading tariff data from Azure Blob Storage (no local fallback)...
📡 Fetching from: https://harmonytariff.blob.core.windows.net/tariff-data/tariff_processed.json
✅ Successfully loaded tariff data from Azure
⏱️  Load time: 1247ms
📊 Total tariff entries loaded: 19847
📅 Data last updated: 2024-06-06
```

### Cached Lookup:
```
📦 Tariff data already loaded and cached
```

## 🎉 Test Complete!

If all tests pass, the Azure-only implementation is working correctly:
- ✅ Faster app startup
- ✅ Smaller bundle size
- ✅ On-demand data loading
- ✅ Proper caching
- ✅ All functionality preserved
- ✅ New elegant UI working

The app is now optimized for production with pure cloud-based data loading!
