const data = require('./src/data/tariff_processed.json');
const tariffs = data.tariffs;

console.log('=== SECTION 301 (CHINA) EXAMPLES ===');
const section301 = tariffs.filter(t => t.additional_duty && t.additional_duty.includes('301')).slice(0, 4);
section301.forEach(t => console.log(`${t.hts8}: ${t.brief_description} - ${t.additional_duty}`));

console.log('\n=== STEEL PRODUCTS (Chapter 72-73) ===');
const steel = tariffs.filter(t => t.hts8.startsWith('72') || t.hts8.startsWith('73')).slice(0, 4);
steel.forEach(t => console.log(`${t.hts8}: ${t.brief_description}`));

console.log('\n=== ALUMINUM PRODUCTS (Chapter 76) ===');
const aluminum = tariffs.filter(t => t.hts8.startsWith('76')).slice(0, 4);
aluminum.forEach(t => console.log(`${t.hts8}: ${t.brief_description}`));

console.log('\n=== PRODUCTS WITH FTA RATES ===');
const ftaProducts = tariffs.filter(t =>
  t.usmca_ad_val_rate !== undefined ||
  t.korea_ad_val_rate !== undefined ||
  t.australia_ad_val_rate !== undefined ||
  t.japan_ad_val_rate !== undefined
).slice(0, 8);
ftaProducts.forEach(t => {
  const ftaRates = [];
  if (t.usmca_ad_val_rate !== undefined) ftaRates.push(`USMCA: ${t.usmca_ad_val_rate}`);
  if (t.korea_ad_val_rate !== undefined) ftaRates.push(`Korea: ${t.korea_ad_val_rate}`);
  if (t.australia_ad_val_rate !== undefined) ftaRates.push(`Australia: ${t.australia_ad_val_rate}`);
  if (t.japan_ad_val_rate !== undefined) ftaRates.push(`Japan: ${t.japan_ad_val_rate}`);
  console.log(`${t.hts8}: ${t.brief_description} - ${ftaRates.join(', ')}`);
});

console.log('\n=== PRODUCTS WITH ONLY MFN RATES ===');
const mfnOnly = tariffs.filter(t =>
  t.mfn_ad_val_rate > 0 &&
  !t.usmca_ad_val_rate &&
  !t.korea_ad_val_rate &&
  !t.australia_ad_val_rate &&
  !t.additional_duty &&
  !t.hts8.startsWith('72') &&
  !t.hts8.startsWith('73') &&
  !t.hts8.startsWith('76')
).slice(0, 4);
mfnOnly.forEach(t => console.log(`${t.hts8}: ${t.brief_description} - MFN: ${t.mfn_ad_val_rate}%`));

console.log('\n=== PRODUCTS WITH COLUMN 2 RATES ===');
const col2Products = tariffs.filter(t => t.col2_ad_val_rate && t.col2_ad_val_rate > 0).slice(0, 4);
col2Products.forEach(t => console.log(`${t.hts8}: ${t.brief_description} - Col2: ${t.col2_ad_val_rate}`));

console.log('\n=== NON-STEEL/ALUMINUM PRODUCTS (for testing reciprocal tariffs) ===');
const nonMetals = tariffs.filter(t =>
  !t.hts8.startsWith('72') &&
  !t.hts8.startsWith('73') &&
  !t.hts8.startsWith('76') &&
  !t.additional_duty &&
  t.mfn_ad_val_rate > 0
).slice(0, 4);
nonMetals.forEach(t => console.log(`${t.hts8}: ${t.brief_description}`));
