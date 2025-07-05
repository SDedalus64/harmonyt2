# Tariff Engineering Suggestions – Quick Guide

The Tariff Engineering panel surfaces *alternative HTS codes* you may lawfully use by redesigning materials, manufacturing flow, or assembly origin.

## How it works
1. **Semantic engine** – finds HTS codes whose textual descriptions are highly similar yet fall in *different chapters*, signalling a possible re-classification.
2. **Material engine** – pairs items that differ mainly by *material tokens* (`leather → plastic`, `steel → aluminium`, etc.).
3. **Process & Origin reasoning** – highlights suggestions that shift the *manufacturing stage* (`assembled`, `CKD`, `parts`) or *country-of-origin levers* (e.g., `assembled in Mexico`).

Each suggestion shows:
| Chip | Meaning |
|------|---------|
| `SEM` | semantic similarity (description match) |
| `MAT` | material substitution |

The gray caption under the duty rate explains *why* the row appeared—e.g. `Material swap: aluminium`, `Country-of-origin leverage`, or `Different manufacturing stage`.

## Using the suggestions responsibly
1. **Validate with CBP rulings** – Always confirm via CROSS or request a binding ruling.
2. **Check trade-agreement rules** – Origin shifts only help if you meet regional-value content & tariff-shift rules.
3. **Document your process** – Keep specs, bills-of-materials, and supplier affidavits to prove the engineered change.
4. **Beware of antidumping/countervailing duties** – Duty-free classification doesn't override AD/CVD orders.

## FAQ
*Why do I see "Enter 6–10 digits"?*  – The HTS code must be at least 6 digits (international subheading) but no more than 10 (U.S. statistical suffix).

*Why are some rows rate-tied but not suggested?*  – The engine filters out codes from the *same chapter* to prioritize non-linear options.

*How do I generate a fresh database?*
```bash
# after updating data/sample_tariff_data.csv
npx ts-node -P tsconfig.scripts.json scripts/generateSemanticDB.ts \
  data/sample_tariff_data.csv data/semantic_links_sample.json --consumer
npx ts-node -P tsconfig.scripts.json scripts/generateMaterialAltDB.ts \
  data/sample_tariff_data.csv data/material_alt_links_sample.json
```

Feel free to extend `PROCESS_TOKENS` and `ORIGIN_TOKENS` in `scripts/generateSemanticDB.ts` to detect other engineering levers.