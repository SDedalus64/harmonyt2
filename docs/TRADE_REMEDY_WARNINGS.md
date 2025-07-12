# Trade Remedy Warning System

## Overview

Adds notifications for Anti-dumping (ADD) and Countervailing Duties (CVD) without calculating actual rates, since these are company-specific and extremely complex.

## Implementation Summary

### Complexity: **Medium** (3-5 days + maintenance)

- Provides valuable warnings without rate calculations
- Shows which countries have active orders
- Links to case numbers for reference

## How It Works

### 1. Data Storage

CSV file (`trade_remedies_active.csv`) containing:

- HTS patterns (e.g., "7208" for steel products)
- Product descriptions
- Type (ADD or CVD)
- Affected countries
- Case numbers
- Effective dates

### 2. During Preprocessing

```python
# Check each HTS code for trade remedies
remedy_warnings = check_trade_remedies(hts_code, remedies)
if remedy_warnings:
    entry['trade_remedy_flags'] = remedy_warnings
```

### 3. In the UI Results

```typescript
// After duty calculation
if (entry.trade_remedy_flags?.has_trade_remedies) {
  breakdown.push("");
  breakdown.push("⚠️ TRADE REMEDY NOTICE:");

  if (entry.trade_remedy_flags.add_notice) {
    breakdown.push(`  • ${entry.trade_remedy_flags.add_notice}`);
  }

  if (entry.trade_remedy_flags.cvd_notice) {
    breakdown.push(`  • ${entry.trade_remedy_flags.cvd_notice}`);
  }

  breakdown.push("  • Contact customs broker for company-specific rates");
  breakdown.push("  • See trade.gov for case details");
}
```

## Example Output

For HTS 7208.10.1500 (Hot-rolled steel) from China:

```
Base Duty Amount: $500.00
Section 232 Steel (50%): +50%
...
Total Duty & Fees: $1,234.56

⚠️ TRADE REMEDY NOTICE:
  • May be subject to anti-dumping duties from: BR, CN, JP +3 more
  • May be subject to countervailing duties from: BR, CN
  • Contact customs broker for company-specific rates
  • See trade.gov for case details
```

## Why This Approach?

### What We're NOT Doing:

- ❌ Calculating specific ADD/CVD rates (too complex, company-specific)
- ❌ Real-time API integration (maintenance burden)
- ❌ Tracking provisional vs final rates
- ❌ Company-specific determinations

### What We ARE Doing:

- ✅ Warning users when ADD/CVD might apply
- ✅ Showing which countries have orders
- ✅ Providing enough info to investigate further
- ✅ Keeping it maintainable

## Maintenance Requirements

### Quarterly Updates:

1. Download latest ADD/CVD orders from trade.gov
2. Update `trade_remedies_active.csv`
3. Test with affected HTS codes

### Sources:

- https://www.trade.gov/us-antidumping-and-countervailing-duties
- Federal Register notices
- CBP CSMS messages

## Future Enhancements

### Phase 2 (Optional):

- Link directly to case details on trade.gov
- Show rate ranges (not company-specific)
- Sunset review status
- Preliminary vs final determination status

### Phase 3 (Complex):

- API integration with Commerce Dept
- Company name lookup for specific rates
- Historical rate tracking

## Implementation Checklist

- [ ] Add `trade_remedies_active.csv` with current orders
- [ ] Update `preprocess_tariff_data.py` to check remedies
- [ ] Add `trade_remedies_flags` to TariffEntry interface
- [ ] Display warnings in tariffService.ts results
- [ ] Style warning message in UI
- [ ] Test with known ADD/CVD products
- [ ] Document update process
