// Quick test to check the calculation flow
const components = [
  { type: "MFN", rate: 0, amount: 0, label: "Most Favored Nation" },
  {
    type: "section_232",
    rate: 50,
    amount: 50000,
    label: "Section 232 Steel (50%)",
  },
];

console.log("Original components:", components);

// Simulate the deduplication logic
const uniqueComponentsMap = new Map();
components.forEach((comp) => {
  const key = `${comp.type.toLowerCase()}|${comp.rate}`;
  console.log(`Processing component: ${comp.type}, key: ${key}`);
  if (!uniqueComponentsMap.has(key)) {
    uniqueComponentsMap.set(key, comp);
    console.log(`  Added to map`);
  } else {
    console.log(`  SKIPPED - duplicate key!`);
  }
});

const dedupedComponents = Array.from(uniqueComponentsMap.values());
console.log("\nDeduped components:", dedupedComponents);
console.log(
  `\nOriginal count: ${components.length}, Deduped count: ${dedupedComponents.length}`,
);
