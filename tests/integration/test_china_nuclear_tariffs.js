#!/usr/bin/env node

// Test script for China tariffs on HTS 84011000 (Nuclear reactors)

const TariffService = require("./src/services/tariffService.ts").TariffService;

async function testChinaTariffs() {
  const tariffService = TariffService.getInstance();

  console.log("🚀 Initializing tariff service...");
  await tariffService.initialize();

  console.log("\n=== Testing HTS 84011000 (Nuclear reactors) from China ===\n");

  // Find the entry first to see what's in the data
  const entry = await tariffService.findTariffEntry("84011000");

  if (!entry) {
    console.error("❌ HTS 84011000 not found in tariff data!");
    return;
  }

  console.log("✅ Found HTS entry:", entry.hts8);
  console.log("Description:", entry.brief_description);

  // Check what's in additive_duties
  if (entry.additive_duties) {
    console.log("\n📋 Additive duties in data:");
    entry.additive_duties.forEach((duty, i) => {
      console.log(`  ${i + 1}. ${duty.label || duty.type}`);
      console.log(`     Type: ${duty.type}`);
      console.log(`     Rate: ${duty.rate}%`);
      console.log(`     Countries: ${JSON.stringify(duty.countries)}`);
    });
  } else {
    console.log("\n⚠️  No additive_duties array found");
  }

  // Check if reciprocal_tariffs array exists
  if (entry.reciprocal_tariffs) {
    console.log("\n📋 Reciprocal tariffs in data:");
    entry.reciprocal_tariffs.forEach((tariff, i) => {
      console.log(`  ${i + 1}. ${tariff.label}`);
      console.log(`     Country: ${tariff.country}`);
      console.log(`     Rate: ${tariff.rate}%`);
    });
  } else {
    console.log("\n⚠️  No reciprocal_tariffs array found");
  }

  // Now calculate duty
  const result = await tariffService.calculateDuty(
    "84011000",
    1000, // $1000 declared value
    "CN", // China
    true, // isReciprocalAdditive
    false, // excludeReciprocalTariff = false (include tariffs)
    false, // isUSMCAOrigin
  );

  if (!result) {
    console.error("\n❌ Calculation failed!");
    return;
  }

  console.log("\n=== CALCULATION RESULTS ===");
  console.log("Total Rate:", result.totalRate + "%");
  console.log("Total Duty & Fees:", "$" + result.amount.toFixed(2));

  console.log("\n📊 Components:");

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

  console.log("\n📝 Breakdown:");
  result.breakdown.forEach((line) => console.log(`  ${line}`));

  console.log("\n=== VERIFICATION ===");
  console.log("Expected tariffs for China (non-exempt HTS):");
  console.log(
    "  Section 301 (25%):",
    hasSection301 ? "✅ FOUND" : "❌ MISSING",
  );
  console.log(
    "  Reciprocal Tariff (10%):",
    hasReciprocal ? "✅ FOUND" : "❌ MISSING",
  );
  console.log(
    "  Fentanyl Tariff (20%):",
    hasFentanyl ? "✅ FOUND" : "❌ MISSING",
  );

  const expectedTotal = 25 + 10 + 20; // 55% total
  const actualTotal = result.totalRate;
  console.log("\nExpected total rate: " + expectedTotal + "%");
  console.log("Actual total rate: " + actualTotal + "%");
  console.log("Match:", actualTotal === expectedTotal ? "✅ YES" : "❌ NO");
}

testChinaTariffs().catch(console.error);
