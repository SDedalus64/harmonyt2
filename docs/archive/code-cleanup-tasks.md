# Code Cleanup Tasks

## Duplicate Components

### CountryLookup Component
- **Used**: `src/components/CountryLookup.tsx` (imported by LookupScreen)
- **Unused**: `src/components/shared/CountryLookup.tsx`
- **Action**: Delete the unused shared version

## Empty/Unused Files

### TestScreen.tsx
- **Location**: `src/screens/TestScreen.tsx`
- **Status**: Empty file but referenced in AppNavigator
- **Action**: Either implement it or remove from navigation and delete

### DrawerSocialContent.tsx
- **Location**: `src/components/DrawerSocialContent.tsx`
- **Status**: Not imported anywhere
- **Action**: Safe to delete

## Code Quality Issues

### 1. Remove unused imports
Check all files for unused imports, especially after removing Expo dependencies.

### 2. Fix the TestScreen reference
In `src/navigation/AppNavigator.tsx`:
- Remove the TestScreen import and route, OR
- Implement a proper TestScreen if needed for development

### 3. Consolidate tariff data handling
Currently using multiple JSON files. Should only use `src/data/tariff_processed.json`.

### 4. Clean up navigation structure
Review if all screens in the navigation are actually used and accessible.

## Performance Optimizations

### 1. Large JSON file loading
- `src/data/tariff_processed.json` is 49MB
- Consider lazy loading or chunking the data
- Implement caching strategy

### 2. Remove console.log statements
Search and remove all debug console.log statements in production code.

### 3. Optimize imports
Use specific imports instead of importing entire libraries where possible.

## Build Configuration Cleanup

### 1. Android
- Update gradle wrapper version
- Remove unused Android permissions
- Clean up ProGuard rules

### 2. iOS
- Remove unused pods
- Update deployment target
- Clean up Info.plist

### 3. Metro Configuration
- Optimize metro.config.js
- Add proper asset extensions
- Configure source map generation

## Testing Infrastructure

### 1. Add basic tests
- No test files found in the project
- Add at least basic component tests
- Add tariff calculation tests

### 2. Linting
- Set up ESLint configuration
- Add pre-commit hooks
- Fix existing linting issues

## Documentation

### 1. Update README
- Add proper setup instructions
- Document the tariff data structure
- Add troubleshooting guide

### 2. Code comments
- Add JSDoc comments to main functions
- Document complex calculations
- Add inline comments for business logic

## Recommended Cleanup Order

1. **Run cleanup.sh** - Remove orphan files
2. **Fix immediate issues**:
   - Remove TestScreen or implement it
   - Delete DrawerSocialContent.tsx
   - Delete src/components/shared/CountryLookup.tsx
3. **Migrate from Expo** (if desired)
4. **Optimize performance**
5. **Add tests and documentation**
