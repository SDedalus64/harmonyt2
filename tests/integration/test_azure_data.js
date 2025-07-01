// Test to check Azure data directly
const fetch = require("node-fetch");

async function testAzureData() {
  const url =
    "https://cs410033fffad325ccb.blob.core.windows.net/$web/TCalc/data/tariff_processed_06232025.json";

  console.log("Fetching data from Azure...");

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log("Data loaded successfully");
    console.log("Total entries:", data.tariffs?.length || 0);
    console.log("Data last updated:", data.data_last_updated);
    console.log("HTS Revision:", data.hts_revision);

    // Find HTS code 72102000
    const entry = data.tariffs?.find((t) => t.hts8 === "72102000");

    if (entry) {
      console.log("\nFound HTS 72102000:");
      console.log("Description:", entry.brief_description);
      console.log("MFN Rate:", entry.mfn_text_rate);

      if (entry.additive_duties) {
        console.log("\nAdditive duties:");
        entry.additive_duties.forEach((duty) => {
          console.log(`  ${duty.type}: ${duty.rate}% - ${duty.label}`);
        });
      } else {
        console.log("\nNO additive_duties field found!");
      }

      // Show all fields that contain '232'
      console.log('\nAll fields containing "232":');
      Object.keys(entry).forEach((key) => {
        const value = JSON.stringify(entry[key]);
        if (value.includes("232")) {
          console.log(`  ${key}: ${value}`);
        }
      });
    } else {
      console.log("\nHTS 72102000 NOT FOUND in Azure data!");
    }
  } catch (error) {
    console.error("Error fetching Azure data:", error);
  }
}

testAzureData();
