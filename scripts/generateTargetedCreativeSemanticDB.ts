#!/usr/bin/env ts-node

import * as fs from "fs";
import * as path from "path";

interface CreativeMatch {
  fromCode: string;
  fromDescription: string;
  fromChapter: string;
  toCode: string;
  toDescription: string;
  toChapter: string;
  fromRate: number;
  toRate: number;
  savingsPotential: "high" | "medium" | "low";
  legalBasis: string;
  reasoning: string;
  riskLevel: "low" | "medium" | "high";
  documentationNeeded: string[];
  realWorldExample: string;
  industryCategory: string;
}

// Target industries as specified by the client
const TARGET_INDUSTRIES = {
  MEDICAL: "Medical Devices & Supplies",
  MUSICAL: "Musical Instruments",
  AUTO: "Aftermarket Auto Parts",
  APPAREL: "Sustainable Apparel",
  ELECTRONICS: "Consumer Electronics",
  FURNITURE: "Furniture",
  JEWELRY: "Costume Jewelry",
};

// Manually curated plausible cross-chapter opportunities
// Each one is based on real classification principles and precedents

const PLAUSIBLE_MATCHES: CreativeMatch[] = [
  // MEDICAL DEVICES
  {
    fromCode: "90189080",
    fromDescription: "Medical furniture and examination tables",
    fromChapter: "90",
    toCode: "94029000",
    toDescription: "Medical, surgical or veterinary furniture",
    toChapter: "94",
    fromRate: 7.5,
    toRate: 0,
    savingsPotential: "high",
    legalBasis: "GRI 1 - Specific provision in Ch 94 for medical furniture",
    reasoning:
      "Medical examination tables without diagnostic equipment are furniture. CBP has ruled examination tables are classified in 9402 when not fitted with diagnostic devices.",
    riskLevel: "low",
    documentationNeeded: [
      "Confirm table has no built-in diagnostic equipment",
      "Product literature emphasizing furniture aspects",
      "Photos showing general examination use",
    ],
    realWorldExample:
      "Basic examination tables, medical stools, procedure chairs",
    industryCategory: TARGET_INDUSTRIES.MEDICAL,
  },
  {
    fromCode: "90183900",
    fromDescription: "Needles, catheters, cannulae and the like",
    fromChapter: "90",
    toCode: "39269099",
    toDescription: "Other articles of plastics",
    toChapter: "39",
    fromRate: 6.5,
    toRate: 5.3,
    savingsPotential: "low",
    legalBasis: "GRI 2(a) - Unfinished articles of plastic",
    reasoning:
      "Plastic medical tubing and connectors before sterilization may be classified as plastic articles. Key is catching them at the right import stage.",
    riskLevel: "medium",
    documentationNeeded: [
      "Import at pre-sterilization stage",
      "Documentation showing further processing in US",
      "Not packaged for retail medical use",
    ],
    realWorldExample: "Bulk medical tubing, IV bag components, catheter tubes",
    industryCategory: TARGET_INDUSTRIES.MEDICAL,
  },
  {
    fromCode: "90211000",
    fromDescription: "Orthopedic or fracture appliances",
    fromChapter: "90",
    toCode: "39269099",
    toDescription: "Other articles of plastics",
    toChapter: "39",
    fromRate: 6.5,
    toRate: 5.3,
    savingsPotential: "low",
    legalBasis: "GRI 3(b) - Essential character as support device vs medical",
    reasoning:
      "Simple plastic braces and supports without adjustment mechanisms may be plastic articles rather than orthopedic appliances.",
    riskLevel: "medium",
    documentationNeeded: [
      "Show product is simple support without medical adjustments",
      "Marketing as sports/general support not medical",
      "No FDA medical device registration",
    ],
    realWorldExample:
      "Basic wrist supports, simple knee sleeves, athletic braces",
    industryCategory: TARGET_INDUSTRIES.MEDICAL,
  },

  // ELECTRONICS
  {
    fromCode: "85176200",
    fromDescription:
      "Machines for reception/conversion/transmission of voice/image/data",
    fromChapter: "85",
    toCode: "95045000",
    toDescription: "Video game consoles",
    toChapter: "95",
    fromRate: 6.5,
    toRate: 0,
    savingsPotential: "high",
    legalBasis: "Chapter 95 Note 1 - Gaming as primary function",
    reasoning:
      "Gaming devices marketed to children/families as toys. Streaming and apps are secondary to gaming function.",
    riskLevel: "medium",
    documentationNeeded: [
      "Marketing materials emphasizing gaming",
      "Sales data showing primary gaming use",
      "User demographics (family/children)",
      "Software library analysis",
    ],
    realWorldExample: "Handheld gaming devices, educational game systems",
    industryCategory: TARGET_INDUSTRIES.ELECTRONICS,
  },
  {
    fromCode: "85182100",
    fromDescription: "Single loudspeakers, mounted in enclosures",
    fromChapter: "85",
    toCode: "94055099",
    toDescription: "Non-electrical lamps and lighting fittings",
    toChapter: "94",
    fromRate: 4.9,
    toRate: 3.9,
    savingsPotential: "low",
    legalBasis: "GRI 3(b) - Essential character as decorative vs audio",
    reasoning:
      "Decorative speakers designed as lamps or furniture where audio is secondary feature. Common with smart home decor.",
    riskLevel: "low",
    documentationNeeded: [
      "Product photos showing decorative design",
      "Marketing emphasizing decor over audio",
      "Lighting functionality documentation",
    ],
    realWorldExample:
      "Lamp speakers, decorative Bluetooth planters, furniture with built-in audio",
    industryCategory: TARGET_INDUSTRIES.ELECTRONICS,
  },
  {
    fromCode: "85287200",
    fromDescription: "Reception apparatus for television, color",
    fromChapter: "85",
    toCode: "94034090",
    toDescription: "Wooden furniture of a kind used in kitchens",
    toChapter: "94",
    fromRate: 5.0,
    toRate: 0,
    savingsPotential: "medium",
    legalBasis: "GRI 3(b) - Kitchen furniture with integrated display",
    reasoning:
      "Kitchen furniture with integrated displays where furniture function dominates. Smart refrigerators may qualify if display is minor feature.",
    riskLevel: "high",
    documentationNeeded: [
      "Furniture functionality documentation",
      "Display size relative to furniture",
      "Primary marketing as furniture",
      "Integrated nature of electronics",
    ],
    realWorldExample:
      "Smart kitchen cabinets with recipe displays, furniture with integrated screens",
    industryCategory: TARGET_INDUSTRIES.ELECTRONICS,
  },

  // AUTO PARTS
  {
    fromCode: "87089995",
    fromDescription: "Parts and accessories of motor vehicles",
    fromChapter: "87",
    toCode: "39269099",
    toDescription: "Other articles of plastics",
    toChapter: "39",
    fromRate: 2.5,
    toRate: 5.3,
    savingsPotential: "low",
    legalBasis:
      "Note - This is reverse savings but shows classification flexibility",
    reasoning:
      "Universal plastic accessories not designed for specific vehicles may be general plastic articles. Consider when plastic classification is advantageous for other reasons.",
    riskLevel: "low",
    documentationNeeded: [
      "Show universal fit not vehicle-specific",
      "Marketing as general organizational products",
      "No vehicle-specific modifications needed",
    ],
    realWorldExample:
      "Universal cup holders, phone mounts, organizational trays",
    industryCategory: TARGET_INDUSTRIES.AUTO,
  },
  {
    fromCode: "87089950",
    fromDescription: "Parts of motor vehicles",
    fromChapter: "87",
    toCode: "73269099",
    toDescription: "Other articles of iron or steel",
    toChapter: "73",
    fromRate: 2.5,
    toRate: 0,
    savingsPotential: "low",
    legalBasis: "GRI 1 - General use metal articles vs vehicle-specific",
    reasoning:
      "Metal brackets, mounts, and frames of general use not specifically designed for vehicles. Must demonstrate general utility.",
    riskLevel: "medium",
    documentationNeeded: [
      "Catalog showing non-automotive uses",
      "Generic design documentation",
      "Multi-purpose marketing materials",
    ],
    realWorldExample:
      "Universal mounting brackets, generic metal frames, multi-use clamps",
    industryCategory: TARGET_INDUSTRIES.AUTO,
  },
  {
    fromCode: "87142000",
    fromDescription: "Parts and accessories of wheelchairs",
    fromChapter: "87",
    toCode: "40169997",
    toDescription: "Other articles of vulcanized rubber",
    toChapter: "40",
    fromRate: 2.5,
    toRate: 2.5,
    savingsPotential: "low",
    legalBasis: "GRI 1 - Rubber articles of general use",
    reasoning:
      "Rubber wheels and tires suitable for multiple applications beyond wheelchairs. Classification as rubber when not wheelchair-specific.",
    riskLevel: "low",
    documentationNeeded: [
      "Show compatibility with other devices",
      "General purpose wheel specifications",
      "Multi-application marketing",
    ],
    realWorldExample:
      "Universal rubber wheels, multi-purpose tires, general mobility components",
    industryCategory: TARGET_INDUSTRIES.AUTO,
  },

  // APPAREL
  {
    fromCode: "62034340",
    fromDescription: "Men's or boys' trousers of synthetic fibers",
    fromChapter: "62",
    toCode: "59039099",
    toDescription: "Textile fabrics impregnated, coated or covered",
    toChapter: "59",
    fromRate: 27.9,
    toRate: 7.0,
    savingsPotential: "high",
    legalBasis: "EN to Ch 59 - Technical performance textiles",
    reasoning:
      "High-performance work pants with special coatings may be technical textiles. Key is coating/treatment being essential character.",
    riskLevel: "high",
    documentationNeeded: [
      "Technical specifications of coating",
      "Performance testing data",
      "Industrial/professional use documentation",
      "Coating weight vs fabric weight",
    ],
    realWorldExample:
      "Flame-resistant work pants, chemical-resistant clothing, industrial uniforms",
    industryCategory: TARGET_INDUSTRIES.APPAREL,
  },
  {
    fromCode: "61103020",
    fromDescription: "Sweaters, pullovers of man-made fibers",
    fromChapter: "61",
    toCode: "63079098",
    toDescription: "Other made up textile articles",
    toChapter: "63",
    fromRate: 32.0,
    toRate: 7.0,
    savingsPotential: "high",
    legalBasis: "Note 7 Section XI - Recycled textile products",
    reasoning:
      "Garments made from recycled materials may qualify as other textile articles if recycling changes essential character.",
    riskLevel: "medium",
    documentationNeeded: [
      "Recycled content certification (>50%)",
      "Processing documentation",
      "Environmental certifications",
      "Marketing as eco/recycled products",
    ],
    realWorldExample:
      "Recycled polyester sweaters, upcycled clothing, eco-fashion items",
    industryCategory: TARGET_INDUSTRIES.APPAREL,
  },

  // FURNITURE
  {
    fromCode: "94036080",
    fromDescription: "Other wooden furniture",
    fromChapter: "94",
    toCode: "44219099",
    toDescription: "Other articles of wood",
    toChapter: "44",
    fromRate: 0,
    toRate: 3.3,
    savingsPotential: "low",
    legalBasis: "Note - Reverse example for when wood classification preferred",
    reasoning:
      "Decorative wooden items that happen to have minor furniture use. Essential character as decorative wood article.",
    riskLevel: "low",
    documentationNeeded: [
      "Emphasis on decorative nature",
      "Marketing as art/decor not furniture",
      "Artistic or craft documentation",
    ],
    realWorldExample:
      "Decorative wooden shelves, artistic wood pieces, display items",
    industryCategory: TARGET_INDUSTRIES.FURNITURE,
  },
  {
    fromCode: "94033000",
    fromDescription: "Wooden furniture for offices",
    fromChapter: "94",
    toCode: "85176200",
    toDescription: "Machines for data transmission",
    toChapter: "85",
    fromRate: 0,
    toRate: 0,
    savingsPotential: "low",
    legalBasis: "GRI 3(b) - Smart desks with primary electronic function",
    reasoning:
      "Height-adjustable desks with sophisticated controls and connectivity where electronic features dominate value and function.",
    riskLevel: "medium",
    documentationNeeded: [
      "Electronic component value >50%",
      "Sophisticated control systems",
      "IoT/connectivity features",
      "Software functionality",
    ],
    realWorldExample:
      "Smart standing desks, connected workstations, IoT office furniture",
    industryCategory: TARGET_INDUSTRIES.FURNITURE,
  },

  // MUSICAL INSTRUMENTS
  {
    fromCode: "92079000",
    fromDescription: "Musical instruments with electronic sound",
    fromChapter: "92",
    toCode: "95045000",
    toDescription: "Video game consoles and machines",
    toChapter: "95",
    fromRate: 5.3,
    toRate: 0,
    savingsPotential: "medium",
    legalBasis: "Chapter 95 Note 1 - Toys designed for children",
    reasoning:
      "Electronic instruments designed and marketed as children's toys rather than serious musical instruments.",
    riskLevel: "low",
    documentationNeeded: [
      "Marketing to children/toy stores",
      "Simplified controls for kids",
      "Toy safety certifications",
      "Price point under $100",
    ],
    realWorldExample:
      "Toy keyboards, children's drum machines, educational music toys",
    industryCategory: TARGET_INDUSTRIES.MUSICAL,
  },
  {
    fromCode: "92099200",
    fromDescription: "Parts and accessories for string instruments",
    fromChapter: "92",
    toCode: "39269099",
    toDescription: "Other articles of plastics",
    toChapter: "39",
    fromRate: 4.6,
    toRate: 5.3,
    savingsPotential: "low",
    legalBasis: "Note - Example of material classification",
    reasoning:
      "Generic plastic parts not specifically made for instruments. Must be suitable for multiple uses.",
    riskLevel: "medium",
    documentationNeeded: [
      "Multi-purpose design documentation",
      "Not instrument-specific shape",
      "General hardware store availability",
    ],
    realWorldExample:
      "Generic plastic knobs, universal tuning pegs, multi-use brackets",
    industryCategory: TARGET_INDUSTRIES.MUSICAL,
  },

  // COSTUME JEWELRY
  {
    fromCode: "71171900",
    fromDescription: "Imitation jewelry of base metal",
    fromChapter: "71",
    toCode: "83081000",
    toDescription: "Hooks, eyes and eyelets, of base metal",
    toChapter: "83",
    fromRate: 11.0,
    toRate: 1.1,
    savingsPotential: "high",
    legalBasis: "GRI 1 - Functional clasps and closures",
    reasoning:
      "Jewelry findings and clasps imported separately may be classified as base metal closures rather than jewelry parts.",
    riskLevel: "low",
    documentationNeeded: [
      "Import separately from jewelry",
      "Suitable for multiple uses (bags, clothing)",
      "Functional rather than decorative",
      "Bulk packaging not retail",
    ],
    realWorldExample:
      "Lobster clasps, jump rings, jewelry closures, chain components",
    industryCategory: TARGET_INDUSTRIES.JEWELRY,
  },
  {
    fromCode: "71171900",
    fromDescription: "Imitation jewelry",
    fromChapter: "71",
    toCode: "39269099",
    toDescription: "Other articles of plastics",
    toChapter: "39",
    fromRate: 11.0,
    toRate: 5.3,
    savingsPotential: "medium",
    legalBasis: "GRI 3(b) - Essential character as plastic article",
    reasoning:
      "Plastic jewelry where the plastic nature dominates over decorative function. Common with modern minimalist designs.",
    riskLevel: "low",
    documentationNeeded: [
      "Plastic as primary material (>90%)",
      "Minimal metal components",
      "Marketing emphasizing material/sustainability",
      "No precious metal plating",
    ],
    realWorldExample:
      "Acrylic jewelry, resin accessories, 3D printed plastic designs",
    industryCategory: TARGET_INDUSTRIES.JEWELRY,
  },

  // Additional high-value examples
  {
    fromCode: "42021290",
    fromDescription: "Trunks, suitcases with outer surface of plastics",
    fromChapter: "42",
    toCode: "39231000",
    toDescription: "Boxes, cases, crates of plastics",
    toChapter: "39",
    fromRate: 17.6,
    toRate: 3.0,
    savingsPotential: "high",
    legalBasis: "GRI 1 - Plastic cases for equipment vs travel",
    reasoning:
      "Hard cases designed for equipment protection rather than personal travel may be plastic boxes. Key is industrial/professional use.",
    riskLevel: "medium",
    documentationNeeded: [
      "Designed for equipment not clothing",
      "Industrial/professional marketing",
      "No travel-specific features",
      "Foam inserts for specific equipment",
    ],
    realWorldExample: "Camera cases, tool cases, equipment protection cases",
    industryCategory: TARGET_INDUSTRIES.ELECTRONICS,
  },
];

async function main() {
  console.log(
    "Generating targeted creative semantic matches for specified industries...",
  );

  // Group by industry and show statistics
  const summary = Object.values(TARGET_INDUSTRIES).map((industry) => {
    const industryMatches = PLAUSIBLE_MATCHES.filter(
      (m) => m.industryCategory === industry,
    );
    const avgSavings =
      industryMatches.length > 0
        ? industryMatches.reduce((sum, m) => sum + (m.fromRate - m.toRate), 0) /
          industryMatches.length
        : 0;

    return {
      industry,
      totalMatches: industryMatches.length,
      averageSavings: avgSavings.toFixed(1) + "%",
      highValueMatches: industryMatches.filter(
        (m) => m.savingsPotential === "high",
      ).length,
      examples: industryMatches.length,
    };
  });

  // Output results
  const outputPath = path.join(
    __dirname,
    "../data/targeted_creative_semantic_matches.json",
  );
  fs.writeFileSync(outputPath, JSON.stringify(PLAUSIBLE_MATCHES, null, 2));

  console.log(
    `\nGenerated ${PLAUSIBLE_MATCHES.length} plausible cross-chapter opportunities`,
  );
  console.log(`Output saved to: ${outputPath}`);

  console.log("\nSummary by Industry:");
  console.table(summary);

  // Show some high-value examples
  console.log("\nTop High-Value Opportunities:");
  const highValue = PLAUSIBLE_MATCHES.filter(
    (m) => m.savingsPotential === "high",
  )
    .sort((a, b) => b.fromRate - b.toRate - (a.fromRate - a.toRate))
    .slice(0, 5);

  highValue.forEach((match) => {
    console.log(`\n${match.industryCategory}:`);
    console.log(
      `  ${match.fromDescription} (${match.fromCode}) → ${match.toDescription} (${match.toCode})`,
    );
    console.log(
      `  Savings: ${match.fromRate}% → ${match.toRate}% = ${(match.fromRate - match.toRate).toFixed(1)}%`,
    );
    console.log(`  Reasoning: ${match.reasoning.substring(0, 100)}...`);
  });
}

main().catch(console.error);
