const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./src/data/tariff_processed.json', 'utf8'));
const tariffs = data.tariffs;

// Helper function to find examples
function findExamples(filter, limit = 2) {
  return tariffs.filter(filter).slice(0, limit);
}

console.log('HTS CODE EXAMPLES FOR TESTING\n');
console.log('=' .repeat(80));

// CHINA - Positive (triggers Section 301 + Reciprocal)
console.log('\n1. CHINA - Positive triggers (Section 301 + Reciprocal):');
const chinaPositive = findExamples(t =>
  t.additional_duty && t.additional_duty.includes('301') &&
  !t.hts8.startsWith('72') && !t.hts8.startsWith('73') && !t.hts8.startsWith('76')
);
chinaPositive.forEach(t => console.log(`   ${t.hts8} - ${t.brief_description}`));

// CHINA - Negative (no Section 301)
console.log('\n2. CHINA - Negative triggers (only Reciprocal):');
const chinaNegative = findExamples(t =>
  !t.additional_duty && t.mfn_ad_val_rate > 0 &&
  !t.hts8.startsWith('72') && !t.hts8.startsWith('73') && !t.hts8.startsWith('76')
);
chinaNegative.forEach(t => console.log(`   ${t.hts8} - ${t.brief_description}`));

// CANADA/MEXICO - Positive (triggers Reciprocal)
console.log('\n3. CANADA/MEXICO - All non-steel/aluminum products trigger 25% reciprocal:');
const canadaMexicoExamples = findExamples(t =>
  !t.hts8.startsWith('72') && !t.hts8.startsWith('73') && !t.hts8.startsWith('76') &&
  t.mfn_ad_val_rate >= 0
);
canadaMexicoExamples.forEach(t => console.log(`   ${t.hts8} - ${t.brief_description}`));

// RUSSIA/BELARUS - Column 2 rates
console.log('\n4. RUSSIA/BELARUS - Products with Column 2 rates:');
const col2Examples = findExamples(t => t.col2_ad_val_rate > 0);
col2Examples.forEach(t => console.log(`   ${t.hts8} - ${t.brief_description} (Col2: ${t.col2_ad_val_rate * 100}%)`));

// STEEL (Section 232 - 50% to ALL countries)
console.log('\n5. STEEL PRODUCTS (Section 232 - 50% to ALL):');
const steelExamples = findExamples(t => t.hts8.startsWith('72') || t.hts8.startsWith('73'));
steelExamples.forEach(t => console.log(`   ${t.hts8} - ${t.brief_description}`));

// ALUMINUM (Section 232 - 50% to ALL countries)
console.log('\n6. ALUMINUM PRODUCTS (Section 232 - 50% to ALL):');
const aluminumExamples = findExamples(t => t.hts8.startsWith('76'));
aluminumExamples.forEach(t => console.log(`   ${t.hts8} - ${t.brief_description}`));

// FTA Products
console.log('\n7. PRODUCTS WITH FTA RATES:');
const ftaExamples = findExamples(t =>
  t.usmca_ad_val_rate !== undefined ||
  t.korea_ad_val_rate !== undefined ||
  t.australia_ad_val_rate !== undefined ||
  t.japan_ad_val_rate !== undefined, 4
);
ftaExamples.forEach(t => {
  const rates = [];
  if (t.usmca_ad_val_rate !== undefined) rates.push(`USMCA:${t.usmca_ad_val_rate * 100}%`);
  if (t.korea_ad_val_rate !== undefined) rates.push(`Korea:${t.korea_ad_val_rate * 100}%`);
  if (t.australia_ad_val_rate !== undefined) rates.push(`Australia:${t.australia_ad_val_rate * 100}%`);
  if (t.japan_ad_val_rate !== undefined) rates.push(`Japan:${t.japan_ad_val_rate * 100}%`);
  console.log(`   ${t.hts8} - ${t.brief_description} (${rates.join(', ')})`);
});

// MFN Only Products
console.log('\n8. PRODUCTS WITH ONLY MFN RATES:');
const mfnOnlyExamples = findExamples(t =>
  t.mfn_ad_val_rate > 0 &&
  !t.usmca_ad_val_rate && !t.korea_ad_val_rate &&
  !t.australia_ad_val_rate && !t.japan_ad_val_rate &&
  !t.additional_duty && !t.col2_ad_val_rate &&
  !t.hts8.startsWith('72') && !t.hts8.startsWith('73') && !t.hts8.startsWith('76'), 4
);
mfnOnlyExamples.forEach(t => console.log(`   ${t.hts8} - ${t.brief_description} (MFN: ${t.mfn_ad_val_rate * 100}%)`));

console.log('\n' + '='.repeat(80));
