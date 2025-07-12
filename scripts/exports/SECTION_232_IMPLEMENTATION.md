# Section 232 Implementation Guide

## Overview

Section 232 tariffs apply to steel and aluminum imports with special provisions for quota countries and the UK.

## Current Rates (as of July 2025)

- **General Rate**: 50% on all steel and aluminum imports
- **UK Special Rate**: 25% (pending Economic Prosperity Deal negotiations)
- **Quota Countries**: 0% within quota, then standard rates apply

## CSV Structure

### Fields

- `HTS_Code`: The Harmonized Tariff Schedule code (4-digit chapter level or full 8-10 digits)
- `Description`: Product description
- `Section`: Type of Section 232 (232_steel, 232_aluminum, 232_steel_derivative)
- `Product_Type`: steel or aluminum
- `Rate_General`: Standard rate (50%)
- `Rate_UK`: UK special rate (25%)
- `Quota_Countries`: Countries with tariff-rate quota agreements
- `Chapter_99_Codes`: Special Chapter 99 provisions for implementing the tariffs
- `Notes`: Additional information

### Product Coverage

1. **Steel Products**
   - Chapter 72: Iron and steel primary materials
   - Chapter 73: Articles of iron or steel
   - Derivative products in other chapters containing steel

2. **Aluminum Products**
   - Chapter 76: Aluminum and articles thereof
   - Derivative products in other chapters containing aluminum

### Chapter 99 References

Chapter 99 contains special tariff provisions that override normal rates:

**Steel:**

- 9903.80.01: General 50% rate provision
- 9903.80.05-08: UK 25% rate provisions

**Aluminum:**

- 9903.85.01: General 50% rate provision
- 9903.85.12-15: UK 25% rate provisions

### Quota Countries

Countries with active tariff-rate quotas (as of July 2025):

- European Union (EU)
- Brazil (BR)
- Argentina (AR)
- South Korea (KR)
- Japan (JP)
- United Kingdom (UK)

Note: Canada and Mexico previously had exemptions but these were revoked.

### Implementation Notes

1. The system should check if a country has an active quota
2. If within quota limits, 0% Section 232 rate applies
3. If quota exceeded or no quota exists, full rates apply
4. UK gets special 25% rate regardless of quota status
5. Chapter 99 codes take precedence over chapter-based rates

### Integration with HarmonyTi

The app should:

1. Check if HTS code matches Section 232 products
2. Verify if importing country has quota arrangement
3. Show quota checkbox when applicable
4. Apply correct rate based on quota status and country
5. Display warning for UK arrangements under negotiation
