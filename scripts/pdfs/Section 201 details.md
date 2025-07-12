### **Key “how-to-apply” data you’ll probably want in HarmonyTI for**

### **Section 201 safeguards**

| **Element to capture**                                        | **Why it matters**                                                                                                                                                                                                                          | **Where it comes from**                                                                                                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HTS_Code** (we already extracted)                           | Tells HarmonyTI that a shipment falls under the safeguard.                                                                                                                                                                                  | Annex I (solar) or Annex II (washers) of the 201 proclamations.                                                                                                   |
| **Safeguard Rate Yr 1 (%):** _or absolute $/unit for washers_ | Year-1 is the rate that applies unless the entry date has rolled into a later period.                                                                                                                                                       | Rate tables in each proclamation. For solar: 30 % ad-valorem in year 1; for washers: up to $1.20 per unit for large residential washers, $0.60 for covered parts. |
| **Safeguard Rate Yr 2, Yr 3, Yr 4**                           | The Section 201 duty phases down annually (solar 30 → 25 → 20 → 15 %; washers tariff-rate-quota band drops). HarmonyTI can select the proper rate automatically from the entry date.                                                        | Same annex table.                                                                                                                                                 |
| **Period Start / End Dates**                                  | Lets your calculation pick the correct year-band without manual lookup.                                                                                                                                                                     | Proclamation text (effective date + four anniversaries).                                                                                                          |
| **Quota Qty (Yr 1–Yr 4) for washers**                         | The washer safeguard is a **tariff-rate quota** (TRQ) — once the in-quota volume is exhausted, the higher out-of-quota rate applies. HarmonyTI needs the tonnage limits to decide in/out-of-quota if you maintain an internal fill tracker. | Annex II washer TRQ schedule.                                                                                                                                     |
| **Derived DutyHeading**                                       | The Chapter 99 heading you must transmit on the entry (e.g., **9903.45.21** for solar Yr 1, **9903.45.22** for solar Yr 2, etc.). HarmonyTI can map rate-year → heading automatically.                                                      | Proclamation annex; each rate band has a dedicated 9903 heading.                                                                                                  |
| **Notes / Exclusions**                                        | Solar cells up to 2.5 GW annually are exempt; washers have parts exemptions. HarmonyTI can flag these situations to skip the safeguard.                                                                                                     | Footnotes in the proclamations.                                                                                                                                   |

---

### **Minimal CSV schema example (solar cells & modules)**

```
HTS_Code,Description,Safeguard_Start,Safeguard_End,Rate_Y1,Rate_Y2,Rate_Y3,Rate_Y4,DutyHeading_Y1,DutyHeading_Y2,DutyHeading_Y3,DutyHeading_Y4,Quota_MW,Section
8541.40.6020,Crystalline-silicon photovoltaic cells,2018-02-07,2022-02-06,30,25,20,15,9903.45.21,9903.45.22,9903.45.23,9903.45.24,2500,201
...
```

_(Set_ _Quota_MW_ _blank for modules; populate washer lines with unit quotas instead.)_

---

### **How HarmonyTI would use this**

1. **Lookup:** Find the HTS code in the 201 master table.

2. **Date logic:** Compare EntryDate with Safeguard_Start / End to pick the correct year-band.

3. **Quota logic (washers):**
   - Track cumulative imports in the tariff-rate-quota pool.
   - If quota remaining ≥ shipment quantity, apply in-quota heading; otherwise split in/out-quota.

4. **Duty calculation:** Apply the safeguard ad-valorem rate (solar) _or_ specific dollar rate (washers).

5. **Transmit:** Use the correct Chapter 99 heading from the table.

---

### **Where to get the numeric tables**

_Solar products (Proc. 9693)_

- 30 % → 25 % → 20 % → 15 % ad-valorem, cells up to 2.5 GW exempt each year.\*

_Large residential washers (Proc. 9694)_

- Yr 1 in-quota $0.50/unit + 20 %; out-of-quota $1.00/unit + 50 % (rates phase down each year).\*

Populate those figures once and HarmonyTI can automate the rest. If you’d like, I can extract those numeric tables into a ready-to-merge CSV for you—just let me know!
