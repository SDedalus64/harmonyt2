# Section 201 Solar Safeguard Implementation

## Overview

Section 201 safeguards apply to Crystalline Silicon Photovoltaic (CSPV) cells and modules under Presidential Proclamation 9693 (as extended).

## Current Status (2025-2026)

- **Effective Period**: February 7, 2025 - February 6, 2026
- **Rate**: 14.0% ad valorem
- **Cell Quota**: 12.5 GW annually (0% within quota, 14% over quota)
- **Module Quota**: None (14% applies to all imports)
- **Chapter 99 Code**: 9903.45.25

## Covered Products

### Solar Cells (with quota)

- 8541.42.0010: Solar cells, crystalline silicon
- 8541.42.0020: Solar cells, crystalline silicon, not exceeding 156mm
- 8541.42.0090: Solar cells, other crystalline silicon

### Solar Modules (no quota)

- 8541.43.0010: Modules, crystalline silicon
- 8541.43.0020: Modules, power not exceeding 50 W
- 8541.43.0030: Modules, power exceeding 50 W but not exceeding 120 W
- 8541.43.0040: Modules, power exceeding 120 W

### Related Products (when containing CSPV cells)

- 8501.31.8050: DC generators with attached CSPV cells
- 8501.61.0000: AC generators with attached CSPV cells
- 8507.20.8000: Lead-acid batteries with attached CSPV cells

## Exempt Countries

The following developing countries are exempt from Section 201 safeguards:

- Brazil (BR)
- Cambodia (KH)
- Indonesia (ID)
- South Africa (ZA)
- Ukraine (UA)
- Thailand (TH)
- Turkey (TR)

## Implementation Details

### Hybrid Processing Approach

Section 201 is configured as "preprocess" in the hybrid architecture:

- Stable tariff rates are added to JSON during preprocessing
- Country exemptions are checked at runtime
- Quota status would require runtime checking (not currently implemented)

### UI Requirements

1. **No checkbox needed** - Unlike Section 232, Section 201 doesn't require user input for quota status
2. **Country exemption** - Automatically applied based on country selection
3. **Clear labeling** - Results should show "Section 201 Safeguard (14.0%)" when applied

### Future Enhancements

1. **Quota Tracking**: Implement CBP integration to check real-time quota fill rates
2. **Historical Rates**: Support for retroactive calculations using historical rate tables:
   - Year 1 (2018-2019): 30%
   - Year 2 (2019-2020): 25%
   - Year 3 (2020-2021): 20%
   - Year 4 (2021-2022): 15%
   - Extensions: Various rates through current 14%

## CSV Data Format

The `section201_solar.csv` file contains:

- HTS_Code: Full 10-digit HTS classification
- Product_Type: cell/module/generator/battery
- Quota_GW: Annual quota in gigawatts (cells only)
- Current_Rate: 14.0% for all products
- Exempt_Countries: ISO codes for exempt countries
- Chapter_99_Code: 9903.45.25 for duty reporting

## Testing Checklist

- [ ] Solar cell from non-exempt country → 14% safeguard
- [ ] Solar cell from Brazil → 0% (exempt)
- [ ] Solar module from any country → 14% (or 0% if exempt)
- [ ] DC generator with CSPV cells → 14% when applicable
- [ ] Verify Chapter 99 code appears in results
