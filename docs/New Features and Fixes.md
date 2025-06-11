## New Features and Fixes

### 1. Fixed SettingsProvider Error

- Added SettingsProvider to the App component tree in App.tsx

- Resolved the error: "useSettings must be used within a SettingsProvider"

- Now the settings functionality works properly throughout the app

### 2. Removed Reciprocal Tariff Toggle

- Removed the "Make Reciprocal Tariffs Additive" toggle from the Lookup screen

- Reciprocal tariffs are now always treated as additive when they apply

- Simplified the user interface and calculation logic

- Updated both the UI (LookupScreen.tsx) and the calculation logic (tariffService.ts and useTariff.ts)

### 3. Updated Brand Color Styling

- Placeholder Text: Changed all placeholder text colors to light blue (electricBlue: #0099FF):

- HTS Code input placeholder

- Declared Value input placeholder

- Freight Cost input placeholder

- Unit Count input placeholder

- Country selection placeholder (including icon)



- Input Values: Confirmed entered values display in dark blue (darkNavy: #0A1A3E)

- Results Screen Styling:

- Country name now displays in light blue with 100% opacity

- Other results text (labels, rates) now display in dark blue

- Improved visual hierarchy and brand consistency

### 4. Added "None" Option for Default Country

- Added a "None" option at the top of the country selection list in Settings

- Allows users to clear any previously selected default country

- "None" displays in italic gray text for visual distinction

- When "None" is selected, the Lookup screen won't pre-select any country

- Updated the clear all data function to reset to "None" instead of defaulting to China

## Technical Changes Summary

Files Modified:

1. App.tsx - Added SettingsProvider

1. src/screens/LookupScreen.tsx - Removed toggle UI, updated colors

1. src/services/tariffService.ts - Simplified reciprocal tariff logic

1. src/hooks/useTariff.ts - Updated default parameter

1. src/components/CountryLookup.tsx - Updated placeholder colors

1. src/screens/CountrySelectionScreen.tsx - Added "None" option

1. src/screens/SettingsScreen.tsx - Updated to handle "None" selection

All changes maintain backward compatibility and improve the user experience by simplifying the interface and making the app's visual design more consistent with the brand colors.