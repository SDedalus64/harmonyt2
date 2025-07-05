import fs from 'fs';

// Material tokens to consider for variation.
const MATERIAL_TOKENS = [
  'leather',
  'plastic',
  'wood',
  'metal',
  'steel',
  'aluminum',
  'copper',
  'cotton',
  'wool',
  'polyester',
  'synthetic',
  'rubber',
  'glass',
  'ceramic',
  'paper',
  'cardboard',
  'silk',
  'nylon',
];

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'of',
  'in',
  'to',
  'a',
  'an',
  'or',
  'with',
  'without',
  'than',
  'other',
  'not',
  'all',
  'n/a',
]);

interface TokenSet extends Set<string> {}
interface Item {
  code: string;
  description: string;
  tokens: TokenSet;
  nonMaterial: TokenSet;
  materials: TokenSet;
}
interface Link { code: string; score: number; }
interface DB { [code: string]: Link[]; }

function tokenize(raw: string): TokenSet {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const set: TokenSet = new Set();
  for (const tok of cleaned.split(' ')) {
    if (tok.length <= 2) continue;
    if (STOP_WORDS.has(tok)) continue;
    set.add(tok);
  }
  return set;
}

function splitMaterials(tokens: TokenSet): { nonMat: TokenSet; mats: TokenSet } {
  const nonMat: TokenSet = new Set();
  const mats: TokenSet = new Set();
  tokens.forEach((t) => {
    if (MATERIAL_TOKENS.includes(t)) mats.add(t);
    else nonMat.add(t);
  });
  return { nonMat, mats };
}

function jaccard(a: TokenSet, b: TokenSet): number {
  let inter = 0;
  a.forEach((t) => {
    if (b.has(t)) inter += 1;
  });
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function build(dbPath: string, outPath: string, threshold = 0.6): void {
  const raw = fs.readFileSync(dbPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const items: Item[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const [code, desc] = lines[i].split(',', 2);
    if (!code || !desc) continue;
    const tokens = tokenize(desc);
    const { nonMat, mats } = splitMaterials(tokens);
    items.push({ code, description: desc, tokens, nonMaterial: nonMat, materials: mats });
  }

  const db: DB = {};

  items.forEach((it) => {
    const alts: Link[] = [];
    items.forEach((other) => {
      if (it.code === other.code) return;
      if (it.materials.size === 0 || other.materials.size === 0) return;
      // Must have different material sets
      let diff = false;
      it.materials.forEach((m) => {
        if (!other.materials.has(m)) diff = true;
      });
      if (!diff) return;
      const baseSim = jaccard(it.nonMaterial, other.nonMaterial);
      if (baseSim >= threshold) {
        alts.push({ code: other.code, score: Number(baseSim.toFixed(3)) });
      }
    });
    alts.sort((a, b) => b.score - a.score);
    if (alts.length) db[it.code] = alts.slice(0, 5);
  });

  fs.writeFileSync(outPath, JSON.stringify(db, null, 2), 'utf8');
  console.log(`Material alternative DB written to ${outPath}`);
}

if (require.main === module) {
  const [csvPath, outPath] = process.argv.slice(2);
  if (!csvPath || !outPath) {
    console.error('Usage: ts-node scripts/generateMaterialAltDB.ts <input.csv> <output.json>');
    process.exit(1);
  }
  build(csvPath, outPath);
}