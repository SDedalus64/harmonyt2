# Tariff Hybrid Architecture Implementation

## Overview

The hybrid architecture combines the benefits of preprocessing (performance) with runtime flexibility (dynamic rules). This approach is easily reversible by toggling configuration flags.

## Architecture Components

### 1. Shared Configuration (`scripts/config/tariff_rules.json`)

- Single source of truth for all tariff rules
- Defines processing strategy for each tariff type
- Used by both Python preprocessing and TypeScript runtime

### 2. Configuration Control (`src/config/tariffRulesConfig.ts`)

- Master switch: `USE_SHARED_CONFIG` (set to `false` to revert to legacy)
- Feature flags for specific tariff types
- Allows gradual rollout or quick rollback

### 3. Processing Strategies

#### Preprocess Strategy (Stable Tariffs)

- **Section 301**: Lists 1-4A with fixed rates
- **Section 232**: Steel/aluminum base rates
- **Section 201**: Solar safeguard rates
- Added to JSON during data preparation
- Best for tariffs with stable rates and no user input

#### Runtime Strategy (Dynamic Tariffs)

- **Reciprocal China**: Temporary with exemptions
- **Fentanyl China**: Complex exemption logic
- **IEEPA Canada/Mexico**: USMCA origin checks
- Applied during calculation
- Best for tariffs with complex conditions or frequent changes

## Implemented Sections Status

### Section 301 - China Trade ✅

- **Data**: 10,717 deduplicated HTS codes from 4 lists
- **Rates**: 25% (Lists 1-3), 7.5% (List 4A)
- **Implementation**: Preprocessed into JSON
- **Files**:
  - `scripts/exports/section301_deduplicated.csv`
  - `scripts/exports/SECTION_301_PROCESSING.md`

### Section 232 - Steel & Aluminum ✅

- **Coverage**: Chapters 72-73 (steel), 76 (aluminum)
- **Rates**: 50% general, 25% UK (expired check needed)
- **Quota System**: UI checkbox for quota countries
- **Implementation**: Preprocessed with runtime quota check
- **Files**:
  - `scripts/exports/section232_enhanced.csv`
  - `scripts/data/section232_quota_countries.ts`

### Section 201 - Solar Safeguards ✅

- **Products**: CSPV cells and modules
- **Rate**: 14% (current year)
- **Quota**: 12.5 GW for cells (0% within quota)
- **Exemptions**: 7 developing countries
- **Implementation**: Preprocessed rates, runtime exemptions
- **Files**:
  - `scripts/exports/section201_solar.csv`
  - `scripts/exports/SECTION_201_IMPLEMENTATION.md`

### Reciprocal & Special Tariffs ✅

- **China Reciprocal**: 10% (expires Aug 12, 2025)
- **Fentanyl Anti-Trafficking**: 20% on China
- **IEEPA Canada/Mexico**: 25% (10% for energy/potash)
- **Implementation**: Runtime strategy for flexibility

## How to Revert

If issues arise, revert to legacy behavior:

1. **Quick Revert** (no code changes):

   ```typescript
   // In src/config/tariffRulesConfig.ts
   USE_SHARED_CONFIG: false; // Change from true
   ```

2. **Selective Revert** (specific tariffs):

   ```typescript
   FEATURES: {
     RECIPROCAL_FROM_CONFIG: false,  // Disable specific feature
     IEEPA_FROM_CONFIG: true,
     SECTION_201_FROM_CONFIG: true,
   }
   ```

3. **Data Revert**:
   - Use `update_tariff_simple.sh` instead of `process_tariff_complete.sh`
   - This skips the `--inject-extra-tariffs` flag

## Benefits of Hybrid Approach

1. **No More Duplicates**: Single source of truth eliminates duplicate logic
2. **Easy Updates**: Change rates in one JSON file
3. **Performance**: Stable tariffs preprocessed for speed
4. **Flexibility**: Dynamic tariffs calculated at runtime
5. **Reversible**: Quick fallback to legacy if needed

## Testing Checklist

- [ ] Section 301: China HTS codes show correct percentage
- [ ] Section 232: Quota checkbox appears for eligible countries
- [ ] Section 201: Solar products show 14% (except exempt countries)
- [ ] Reciprocal tariffs: Apply only when not exempted
- [ ] IEEPA: USMCA certificate checkbox prevents application
- [ ] Legacy mode: Setting USE_SHARED_CONFIG=false uses old logic

## Future Enhancements

1. **Quota Integration**: Real-time CBP quota status checks
2. **Historical Rates**: Support retroactive calculations
3. **Automated Updates**: Pull rate changes from official sources
4. **Audit Trail**: Log which rules were applied and why
