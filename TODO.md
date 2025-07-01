# HarmonyTi TODO List

## Pending Tasks

### App Features

1. Add App Store URLs to SettingsScreen
2. Clarify setup for dedola.com sub pages

### Testing

1. Add Jest test for tariff data integrity
2. Add Jest dependencies and verify tests
   - Create tests for lookup errors
3. Add jest and update package manifests

### Code Review & Improvements

1. Review previous tasks for dependencies
2. Review project for inconsistencies and improvements:
   - Tablet info icons: show only on active field focus without breaking drawer trigger
   - Refactor FieldWithInfo to support focus-dependent visibility (tablet) without losing drawer functionality
   - Verify full-height gradient stays after future edits

### Build & Configuration

1. Delete and commit eas.json file removal

## Completed Tasks

| Feature/Fix                                                                                                         | Date      | Developer |
| ------------------------------------------------------------------------------------------------------------------- | --------- | --------- |
| Improve iPhone Info Tab animation: ensure smooth single fade in/out when switching fields (eliminate "double-wink") | 6/23/2025 | Stephe D. |
| Update tariffs lookup for Hong Kong and Macau                                                                       | 6/20/2025 | Stephe D. |
| Update searchByPrefix behavior based on segment loading                                                             | 6/20/2025 | Stephe D. |
| Update README with dev dependencies and test steps                                                                  | 6/23/25   | Cursor    |
| Ensure expo is in dependencies                                                                                      | 6/23/25   | Stephe D. |
