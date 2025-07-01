#!/usr/bin/env node

const TariffService = require("./src/services/tariffService");

async function testChinaTariffs() {
  const tariffService = TariffService.TariffService.getInstance();

  console.log("Initializing tariff service...");
  await tariffService.initialize();

  console.log("\n=== Testing HTS 84011000 (Nuclear reactors) from China ===\n");

  const result = await tariffService.calculateDuty(
    "84011000",
    1000, // $1000 declared value
    "CN", // China
    true, // isReciprocalAdditive
    false, // excludeReciprocalTariff = false (include tariffs)
    false, // isUSMCAOrigin
  );

  if (!result) {
    console.error("No result returned!");
    return;
  }

  console.log("HTS Code:", result.htsCode);
  console.log("Description:", result.description);
  console.log("\nComponents:");

  let hasReciprocal = false;
  let hasFentanyl = false;
  let hasSection301 = false;

  result.components.forEach((comp) => {
    console.log(
      `  ${comp.label || comp.type}: ${comp.rate}% = $${comp.amount.toFixed(2)}`,
    );
    if (comp.type === "reciprocal_tariff") hasReciprocal = true;
    if (comp.type === "fentanyl") hasFentanyl = true;
    if (comp.type === "section_301") hasSection301 = true;
  });

  console.log("\nBreakdown:");
  result.breakdown.forEach((line) => console.log(`  ${line}`));

  console.log("\n=== VERIFICATION ===");
  console.log("Has Section 301 (25%):", hasSection301 ? "✅ YES" : "❌ NO");
  console.log(
    "Has Reciprocal Tariff (10%):",
    hasReciprocal ? "✅ YES" : "❌ NO",
  );
  console.log("Has Fentanyl Tariff (20%):", hasFentanyl ? "✅ YES" : "❌ NO");
  console.log("\nTotal Rate:", result.totalRate + "%");
  console.log("Total Duty & Fees:", "$" + result.amount.toFixed(2));

  // Test exemptions
  console.log("\n\n=== Testing Exemptions ===\n");

  // Test pharmaceutical exemption (Chapter 30)
  console.log(
    "Testing HTS 30021000 (Pharmaceutical - should be exempt from Reciprocal but not Fentanyl):",
  );
  const pharmaResult = await tariffService.calculateDuty(
    "30021000",
    1000,
    "CN",
    true,
    false,
    false,
  );
  if (pharmaResult) {
    const pharmaReciprocal = pharmaResult.components.find(
      (c) => c.type === "reciprocal_tariff",
    );
    const pharmaFentanyl = pharmaResult.components.find(
      (c) => c.type === "fentanyl",
    );
    console.log(
      "  Has Reciprocal:",
      pharmaReciprocal
        ? "❌ YES (should be exempt)"
        : "✅ NO (correctly exempt)",
    );
    console.log("  Has Fentanyl:", pharmaFentanyl ? "✅ YES" : "❌ NO");
  }

  // Test Chapter 98 exemption
  console.log(
    "\nTesting HTS 98010040 (Chapter 98 - should be exempt from Fentanyl):",
  );
  const ch98Result = await tariffService.calculateDuty(
    "98010040",
    1000,
    "CN",
    true,
    false,
    false,
  );
  if (ch98Result) {
    const ch98Reciprocal = ch98Result.components.find(
      (c) => c.type === "reciprocal_tariff",
    );
    const ch98Fentanyl = ch98Result.components.find(
      (c) => c.type === "fentanyl",
    );
    console.log("  Has Reciprocal:", ch98Reciprocal ? "✅ YES" : "❌ NO");
    console.log(
      "  Has Fentanyl:",
      ch98Fentanyl ? "❌ YES (should be exempt)" : "✅ NO (correctly exempt)",
    );
  }
}

testChinaTariffs().catch(console.error);
