# HarmonyTi Beta Test Checklist

## HTS Code Search (NEW FEATURE)

### Basic Search Tests
- [ ] Type "6" - Should show many results from chapters 60-69
- [ ] Type "64" - Should show all footwear codes (~147 results)
- [ ] Type "640" - Should narrow to codes starting with 640
- [ ] Type "6403" - Should show specific footwear subcategories
- [ ] Type "8703" - Should show motor vehicle codes
- [ ] Type "999" - Should show "No matching records"

### Search Behavior Tests
- [ ] Dropdown appears after typing 3 digits
- [ ] Results narrow with each additional digit typed
- [ ] Selecting a dropdown item populates the HTS field
- [ ] Can complete lookup after selecting from dropdown
- [ ] Dropdown shows code and description for each item
- [ ] "Type more digits to refine" message appears when many results

### Performance Tests
- [ ] Search results appear quickly (no lag)
- [ ] Scrolling through results is smooth
- [ ] No app crashes when searching

## History Feature Tests

### Saving to History
- [ ] Complete a lookup and tap "Save & Search"
- [ ] Verify entry appears in History tab
- [ ] Verify saved data includes:
  - [ ] HTS code
  - [ ] Country
  - [ ] Declared value
  - [ ] Unit count (if entered)
  - [ ] Duty calculations
  - [ ] Timestamp

### Restoring from History
- [ ] Tap a history item
- [ ] Verify all fields populate correctly:
  - [ ] HTS code
  - [ ] Country
  - [ ] Declared value
  - [ ] Results display
  - [ ] Unit count (if it was saved)
- [ ] Verify unit calculations show if unit count was saved

## Unit Cost Calculations

### Basic Unit Tests
- [ ] Complete a lookup
- [ ] Enter unit count in the field
- [ ] Verify "First cost per unit" calculation appears
- [ ] For RT countries (CN, CA, MX), verify RT impact shows

### Unit Count in History
- [ ] Save a lookup with unit count entered
- [ ] Go to History tab
- [ ] Select the saved item
- [ ] Verify unit count field is populated
- [ ] Verify unit calculations are displayed

## Country-Specific Features

### Reciprocal Tariff (RT) Tests
- [ ] Select China (CN) - RT toggle should appear
- [ ] Select Canada (CA) - RT toggle should appear
- [ ] Select Mexico (MX) - RT toggle should appear
- [ ] Select Japan (JP) - NO RT toggle should appear
- [ ] Toggle RT on/off and verify calculations update

## Edge Cases

- [ ] Very long HTS codes (8 digits max)
- [ ] Invalid HTS codes
- [ ] Very large declared values
- [ ] Very large unit counts
- [ ] Switching between countries rapidly
- [ ] Backgrounding app and returning

## Platform-Specific Tests

### iOS
- [ ] Screenshot prevention works on results screen
- [ ] Keyboard behavior is correct
- [ ] Safe area insets respected

### Android
- [ ] Back button behavior
- [ ] Keyboard doesn't cover input fields
- [ ] Number pad appears for numeric fields

## Notes for Testers
- Report any crashes with steps to reproduce
- Note any performance issues
- Check for UI/UX inconsistencies
- Verify all monetary values format correctly ($X,XXX.XX)
