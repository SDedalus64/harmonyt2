# Tariff Architecture Refactoring

## Current Problem

The current implementation has duplicate tariff logic in two places:

1. Python preprocessing script (`scripts/data/preprocess_tariff_data.py`)
2. TypeScript runtime code (`src/services/tariffService.ts`)

This leads to:

- Maintenance burden (updating rules in two places)
- Risk of inconsistencies
- Complex duplicate suppression logic
- Confusion about source of truth

## Recommended Solution

### Option 1: Shared Configuration File (Recommended)

**Advantages:**

- Single source of truth for all tariff rules
- Both Python and TypeScript read from same JSON config
- Easy to update rules without changing code
- Version control friendly
- No runtime duplicate checking needed

**Implementation:**

1. Created `scripts/config/tariff_rules.json` with all rules
2. Python script reads this file during preprocessing
3. TypeScript can optionally read it for dynamic tariffs
4. No duplicates possible - rules defined once

### Option 2: Always Preprocess (Alternative)

**Advantages:**

- Simplest runtime code
- No dynamic tariff logic needed
- Best performance (no runtime calculations)

**Disadvantages:**

- Requires reprocessing whenever rules change
- Less flexible for testing

**Implementation:**

1. Remove all dynamic tariff logic from TypeScript
2. Always use `--inject-extra-tariffs` flag
3. All tariffs come from preprocessed JSON

## Migration Steps

1. **Phase 1: Use shared config**

   ```bash
   # Update Python to read from tariff_rules.json
   # Update TypeScript to optionally use it as fallback
   ```

2. **Phase 2: Update preprocessing**

   ```python
   # In preprocess_tariff_data.py
   with open('scripts/config/tariff_rules.json') as f:
       TARIFF_RULES = json.load(f)['tariff_rules']
   ```

3. **Phase 3: Simplify TypeScript**
   ```typescript
   // Remove hardcoded tariff logic
   // Either always expect preprocessed data
   // Or read from tariff_rules.json as needed
   ```

## Benefits

1. **Maintainability**: Update rules in one place
2. **Consistency**: No risk of Python/TypeScript diverging
3. **Simplicity**: No duplicate checking needed
4. **Flexibility**: Easy to add/modify rules
5. **Testing**: Can test with different rule sets

## Example Usage

```typescript
// In tariffService.ts
import { TARIFF_RULES } from "../types/tariffRules";

// Apply rules from configuration
const rule = TARIFF_RULES.tariff_rules.reciprocal_china;
if (rule.countries.includes(countryCode) && !entry.reciprocal_tariffs) {
  // Apply the tariff from config
}
```

This approach follows the DRY (Don't Repeat Yourself) principle and makes the system more maintainable and reliable.
