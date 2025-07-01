// Test script to verify duty calculation for HTS 72102000 from China

// Mock the tariff entry data structure
const mockEntry = {
  hts8: "72102000",
  brief_description:
    "Iron/nonalloy steel, width 600mm+, flat-rolled products, plated or coated with lead, including terneplate",
  is_chapter_99: false,
  quantity_1_code: "KG",
  wto_binding_code: "B",
  mfn_text_rate: "Free",
  mfn_rate_type_code: "0",
  col2_text_rate: "6%",
  col2_rate_type_code: "7",
  begin_effect_date: "2008-01-01",
  end_effective_date: "2050-12-31",
  mfn_ad_val_rate: 0,
  is_special_provision: false,
  mfn_specific_rate: 0,
  mfn_other_rate: 0,
  col2_ad_val_rate: 0.06,
  col2_specific_rate: 0,
  col2_other_rate: 0,
  ntr_suspended_countries: ["RU", "BY"],
  has_special_trade_action: false,
  column2_countries: ["CU", "KP"],
  available_programs: [],
  additive_duties: [
    {
      type: "section_232",
      name: "Section 232 - Steel Tariff",
      rate: 50,
      rate_uk: 25,
      countries: "all",
      countries_reduced: ["GB", "UK"],
      label: "Section 232 Steel (50%, UK 25%)",
      uk_codes: ["9903.80.05", "9903.80.06", "9903.80.07", "9903.80.08"],
    },
  ],
};

console.log("Testing HTS 72102000 duty calculation for China...\n");

// Simulate the calculation logic
const declaredValue = 100000;
const countryCode = "CN";
const countryCodeForTariffs = "CN"; // China maps to CN directly

console.log("Input:");
console.log("- HTS Code:", mockEntry.hts8);
console.log("- Country:", countryCode);
console.log("- Declared Value: $" + declaredValue.toLocaleString());
console.log(
  "- MFN Rate:",
  mockEntry.mfn_text_rate,
  "(" + mockEntry.mfn_ad_val_rate + ")",
);

console.log("\nChecking additive duties...");
if (mockEntry.additive_duties) {
  console.log(
    "Found additive_duties array with",
    mockEntry.additive_duties.length,
    "entries",
  );

  for (const duty of mockEntry.additive_duties) {
    console.log("\nProcessing duty:", duty.type);
    console.log("- Name:", duty.name);
    console.log("- Rate:", duty.rate + "%");
    console.log("- Countries:", duty.countries);
    console.log("- Label:", duty.label);

    // Check if this duty applies to the current country
    if (
      duty.countries === "all" ||
      (Array.isArray(duty.countries) &&
        duty.countries.includes(countryCodeForTariffs))
    ) {
      console.log("✓ This duty APPLIES to", countryCode);

      // Check duplicate checking logic
      const dutyLabelLower = (duty.label || "").toLowerCase();
      const dutyRuleNameLower = (
        duty.rule_name ||
        duty.name ||
        ""
      ).toLowerCase();

      console.log("\nDuplicate checking:");
      console.log("- duty.type:", duty.type);
      console.log("- Label (lower):", dutyLabelLower);
      console.log("- Rule name (lower):", dutyRuleNameLower);

      // This is the problematic duplicate checking logic
      if (
        duty.type === "fentanyl" ||
        duty.type === "reciprocal_tariff" ||
        dutyLabelLower.includes("fentanyl") ||
        dutyLabelLower.includes("reciprocal tariff") ||
        dutyRuleNameLower.includes("fentanyl") ||
        dutyRuleNameLower.includes("reciprocal tariff") ||
        duty.type === "ieepa_tariff"
      ) {
        console.log("✗ SKIPPED due to duplicate checking logic");
      } else {
        console.log("✓ NOT skipped by duplicate checking");

        if (duty.type === "section_232") {
          console.log("\n✓ Section 232 SHOULD BE APPLIED:");
          console.log("- Rate:", duty.rate + "%");
          console.log(
            "- Amount: $" +
              ((declaredValue * duty.rate) / 100).toLocaleString(),
          );
        }
      }
    }
  }
} else {
  console.log("No additive_duties found!");
}

// Calculate expected totals
console.log("\n=== EXPECTED CALCULATION ===");
const mfnDuty = 0; // Free
const section232Duty = declaredValue * 0.5; // 50%
const mpf = Math.min(Math.max(declaredValue * 0.003464, 27.75), 538.4);
const hmf = declaredValue * 0.00125;

console.log("MFN Duty (Free): $0.00");
console.log("Section 232 Steel (50%): $" + section232Duty.toLocaleString());
console.log("Merchandise Processing Fee: $" + mpf.toFixed(2));
console.log("Harbor Maintenance Fee: $" + hmf.toFixed(2));
console.log(
  "\nTotal Duties & Fees: $" + (section232Duty + mpf + hmf).toFixed(2),
);
console.log(
  "Total Landed Cost: $" +
    (declaredValue + section232Duty + mpf + hmf).toFixed(2),
);
