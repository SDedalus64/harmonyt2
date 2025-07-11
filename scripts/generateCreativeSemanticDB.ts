import * as fs from "fs";

/**
 * Generate legitimate cross-chapter semantic matches with defensible reasoning.
 * These are real tariff engineering opportunities based on:
 * 1. Dual-use products (can be classified by material OR function)
 * 2. Component vs complete product classifications
 * 3. Primary function ambiguity
 * 4. Material composition choices
 */

interface CreativeMatch {
  fromCode: string;
  fromDescription: string;
  fromChapter: string;
  toCode: string;
  toDescription: string;
  toChapter: string;
  reasoning: string;
  legalBasis: string;
  realWorldExample?: string;
  savingsPotential: "high" | "medium" | "low";
}

// Known legitimate cross-chapter opportunities based on GRI (General Rules of Interpretation)
const LEGITIMATE_CROSSOVERS = [
  {
    // Textile bags vs leather goods
    fromChapter: "42", // Leather goods
    toChapter: "63", // Other made-up textile articles
    reasoning:
      "Bags and containers can be classified by material (textile Ch 63) or function (travel goods Ch 42)",
    legalBasis: "GRI 3(b) - Classification by essential character",
    example:
      "Canvas travel bags classified as textile articles instead of luggage",
  },
  {
    // Plastic packaging vs specialized containers
    fromChapter: "39", // Plastics
    toChapter: "42", // Travel goods and containers
    reasoning:
      "Plastic containers can be classified by material (Ch 39) or specialized use (Ch 42)",
    legalBasis: "GRI 3(a) - More specific description prevails",
    example: "Plastic camera cases classified as specialized containers",
  },
  {
    // Electronic toys vs electronic devices
    fromChapter: "85", // Electrical machinery
    toChapter: "95", // Toys and games
    reasoning:
      "Electronic items with play value can be toys (Ch 95) despite electronic components",
    legalBasis: "Note 1(m) to Chapter 85 excludes toys",
    example:
      "Electronic learning tablets for children classified as educational toys",
  },
  {
    // Furniture with electronics vs electronic equipment
    fromChapter: "94", // Furniture
    toChapter: "85", // Electrical machinery
    reasoning: "Smart furniture can be classified by primary function",
    legalBasis: "GRI 3(b) - Essential character determination",
    example:
      "Standing desk with built-in computer classified by primary function",
  },
  {
    // Textile clothing vs protective equipment
    fromChapter: "62", // Woven apparel
    toChapter: "39", // Plastics (protective)
    reasoning:
      "Protective clothing with plastic coating may be classified by protective function",
    legalBasis: "Chapter 39 Note 2(l) - Articles of apparel wholly of plastics",
    example: "Hazmat suits classified as plastic articles not apparel",
  },
  {
    // Sports equipment materials
    fromChapter: "39", // Plastics
    toChapter: "95", // Sporting goods
    reasoning:
      "Sporting goods classification supersedes material classification",
    legalBasis: "Chapter 95 covers sporting goods regardless of material",
    example:
      "Plastic dumbbells classified as exercise equipment not plastic articles",
  },
  {
    // Printed matter vs packaging
    fromChapter: "48", // Paper products
    toChapter: "49", // Printed books/materials
    reasoning: "Printed packaging with substantial text can be printed matter",
    legalBasis:
      "Chapter 49 Note 1 - Printed matter with incidental packaging use",
    example:
      "Collectible boxes with extensive printing classified as printed matter",
  },
  {
    // Composite electronic assemblies
    fromChapter: "90", // Optical/measuring instruments
    toChapter: "85", // Electrical machinery
    reasoning: "Multi-function devices classified by primary function",
    legalBasis: "GRI 3(c) - Classification under heading which occurs last",
    example:
      "Smart watches: timekeeping (91) vs electronics (85) vs optical display (90)",
  },
];

// Specific product patterns that often have dual classification
const DUAL_USE_PATTERNS = [
  { pattern: /bag|pouch|case|holder/, chapters: ["39", "42", "63"] },
  { pattern: /toy.*electronic|electronic.*toy/, chapters: ["85", "95"] },
  { pattern: /protective|safety/, chapters: ["39", "61", "62", "65"] },
  {
    pattern: /decorative|ornamental/,
    chapters: ["39", "44", "70", "71", "83"],
  },
  { pattern: /smart|connected|iot/, chapters: ["84", "85", "90", "94"] },
  { pattern: /educational|learning/, chapters: ["49", "85", "95"] },
  { pattern: /portable.*electronic/, chapters: ["84", "85", "90"] },
  { pattern: /container|receptacle/, chapters: ["39", "42", "73", "76"] },
];

function parseCSVLine(line: string): string[] {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function findCreativeMatches(csvPath: string): CreativeMatch[] {
  const matches: CreativeMatch[] = [];
  const entries = new Map<
    string,
    { code: string; description: string; rate: number }
  >();

  // Read and parse CSV
  const raw = fs.readFileSync(csvPath, "utf8");
  const lines = raw.split(/\r?\n/);

  // Parse entries
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 10) continue;

    const code = fields[0];
    const description = fields[1]?.replace(/^"|"$/g, "") || "";
    const rate = parseFloat(fields[5]?.replace("%", "") || "0");

    if (/^\d{8}$/.test(code)) {
      entries.set(code, { code, description, rate });
    }
  }

  // Find legitimate cross-chapter matches
  for (const [code, entry] of entries) {
    const chapter = code.substring(0, 2);
    const descLower = entry.description.toLowerCase();

    // Check each known crossover pattern
    for (const crossover of LEGITIMATE_CROSSOVERS) {
      if (chapter === crossover.fromChapter) {
        // Look for products in the target chapter that could match
        for (const [targetCode, targetEntry] of entries) {
          if (targetCode.substring(0, 2) !== crossover.toChapter) continue;

          // Check if descriptions have semantic overlap
          const targetDescLower = targetEntry.description.toLowerCase();
          const commonWords = getCommonKeywords(descLower, targetDescLower);

          if (
            commonWords.length >= 2 &&
            Math.abs(entry.rate - targetEntry.rate) >= 2
          ) {
            const savingsPotential =
              Math.abs(entry.rate - targetEntry.rate) >= 10
                ? "high"
                : Math.abs(entry.rate - targetEntry.rate) >= 5
                  ? "medium"
                  : "low";

            matches.push({
              fromCode: code,
              fromDescription: entry.description,
              fromChapter: chapter,
              toCode: targetCode,
              toDescription: targetEntry.description,
              toChapter: crossover.toChapter,
              reasoning: crossover.reasoning,
              legalBasis: crossover.legalBasis,
              realWorldExample: crossover.example,
              savingsPotential,
            });

            break; // One match per pattern is enough
          }
        }
      }
    }

    // Check dual-use patterns
    for (const dualUse of DUAL_USE_PATTERNS) {
      if (dualUse.pattern.test(descLower)) {
        for (const targetChapter of dualUse.chapters) {
          if (targetChapter === chapter) continue; // Skip same chapter

          // Find best match in target chapter
          let bestMatch = null;
          let bestScore = 0;

          for (const [targetCode, targetEntry] of entries) {
            if (targetCode.substring(0, 2) !== targetChapter) continue;

            const score = calculateSimilarity(
              descLower,
              targetEntry.description.toLowerCase(),
            );
            if (score > bestScore && score > 0.3) {
              bestScore = score;
              bestMatch = { code: targetCode, entry: targetEntry };
            }
          }

          if (bestMatch && Math.abs(entry.rate - bestMatch.entry.rate) >= 3) {
            matches.push({
              fromCode: code,
              fromDescription: entry.description,
              fromChapter: chapter,
              toCode: bestMatch.code,
              toDescription: bestMatch.entry.description,
              toChapter: targetChapter,
              reasoning: `Dual classification possible: ${descLower.match(dualUse.pattern)?.[0]} can be classified by material or function`,
              legalBasis: "GRI 3 - Classification of composite goods",
              savingsPotential:
                Math.abs(entry.rate - bestMatch.entry.rate) >= 10
                  ? "high"
                  : "medium",
            });
          }
        }
      }
    }
  }

  // Sort by savings potential and limit to best examples
  return matches
    .sort((a, b) => {
      const order = { high: 3, medium: 2, low: 1 };
      return order[b.savingsPotential] - order[a.savingsPotential];
    })
    .slice(0, 30); // Top 30 examples
}

function getCommonKeywords(desc1: string, desc2: string): string[] {
  const words1 = new Set(desc1.split(/\s+/).filter((w) => w.length > 3));
  const words2 = new Set(desc2.split(/\s+/).filter((w) => w.length > 3));

  const common = [];
  for (const word of words1) {
    if (words2.has(word) && !["with", "other", "than", "from"].includes(word)) {
      common.push(word);
    }
  }
  return common;
}

function calculateSimilarity(desc1: string, desc2: string): number {
  const words1 = desc1.split(/\s+/).filter((w) => w.length > 3);
  const words2 = desc2.split(/\s+/).filter((w) => w.length > 3);

  let matches = 0;
  for (const word1 of words1) {
    if (words2.includes(word1)) matches++;
  }

  return matches / Math.max(words1.length, words2.length);
}

function main() {
  const args = process.argv.slice(2);
  const csvPath = args[0];
  const outPath = args[1] || "data/creative_semantic_matches.json";

  if (!csvPath) {
    console.error(
      "Usage: ts-node generateCreativeSemanticDB.ts <tariff_csv> [output.json]",
    );
    process.exit(1);
  }

  console.log(
    "Finding legitimate cross-chapter classification opportunities...",
  );
  const matches = findCreativeMatches(csvPath);

  // Group by fromCode for easier lookup
  const db: Record<string, CreativeMatch[]> = {};
  for (const match of matches) {
    if (!db[match.fromCode]) db[match.fromCode] = [];
    db[match.fromCode].push(match);
  }

  // Add metadata
  const output = {
    generated: new Date().toISOString(),
    description:
      "Legitimate cross-chapter classification opportunities based on GRI and dual-use principles",
    totalMatches: matches.length,
    disclaimer:
      "These are potential reclassifications that require case-by-case analysis and customs approval",
    matches: db,
  };

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Generated ${matches.length} creative semantic matches`);
  console.log(`Output written to ${outPath}`);

  // Show some examples
  console.log("\nExample matches:");
  matches.slice(0, 5).forEach((match) => {
    console.log(
      `\n${match.fromCode} (Ch ${match.fromChapter}) → ${match.toCode} (Ch ${match.toChapter})`,
    );
    console.log(`Reasoning: ${match.reasoning}`);
    console.log(`Legal basis: ${match.legalBasis}`);
    if (match.realWorldExample) {
      console.log(`Example: ${match.realWorldExample}`);
    }
  });
}

if (require.main === module) {
  main();
}
