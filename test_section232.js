const fs = require("fs");
const path = require("path");

// Load the tariff data
const tariffData = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "scripts/data/tariff-segments/tariff-721.json"),
    "utf8",
  ),
);

// Find HTS code 72102000
const entries = tariffData.entries || [];
const entry = entries.find((item) => item.hts8 === "72102000");

if (entry) {
  console.log("Found HTS code 72102000:");
  console.log("Description:", entry.brief_description);
  console.log("MFN Rate:", entry.mfn_text_rate);
  console.log("MFN Ad Valorem Rate:", entry.mfn_ad_val_rate);

  if (entry.additive_duties) {
    console.log("\nAdditive Duties:");
    entry.additive_duties.forEach((duty, index) => {
      console.log(`\n  Duty ${index + 1}:`);
      console.log("    Type:", duty.type);
      console.log("    Name:", duty.name);
      console.log("    Rate:", duty.rate);
      console.log("    Countries:", duty.countries);
      console.log("    Label:", duty.label);
    });
  } else {
    console.log("\nNo additive_duties field found!");
  }

  // Check for Section 232 specifically
  const section232 = entry.additive_duties?.find(
    (d) => d.type === "section_232",
  );
  if (section232) {
    console.log("\n✓ Section 232 Steel Tariff Found:");
    console.log("  Rate:", section232.rate + "%");
    console.log("  Applies to:", section232.countries);
  } else {
    console.log("\n✗ Section 232 NOT FOUND in additive_duties!");
  }
} else {
  console.log("HTS code 72102000 not found in tariff data");
}
