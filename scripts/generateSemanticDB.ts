import fs from 'fs';
import path from 'path';

/**
 * Utility script that parses a U.S. HTS tariff CSV export, derives semantic
 * relationships between HTS codes across chapters (first two-digit prefix)
 * and writes a JSON "database" containing the strongest cross-chapter links.
 *
 * The semantic signal is currently Jaccard similarity over token sets that
 * have been cleaned (lower-cased, punctuation removed, stop-words filtered).
 * While simple, this approach surfaces non-linear textual connections and is
 * light-weight enough to run offline without third-party ML services.
 *
 * Usage (via ts-node):
 *   npx ts-node scripts/generateSemanticDB.ts \
 *     data/csv-exports/tariff_database_2025_06232025.csv \
 *     data/semantic_links.json
 */

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
interface HTSItem {
  code: string; // 6- or 8-digit numeric string
  chapter: string; // first two digits of code
  description: string;
  tokens: TokenSet;
}

interface Link {
  code: string;
  score: number;
}

interface SemanticDB {
  [code: string]: Link[];
}

const DEFAULT_THRESHOLD = 0.25; // Jaccard score
const DEFAULT_TOP_N = 8;

/** Clean and tokenize a description string. */
function tokenize(raw: string): TokenSet {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // remove punctuation, keep alphanumerics
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();

  const tokens = cleaned.split(' ');
  const set: TokenSet = new Set();
  for (const token of tokens) {
    if (token.length <= 2) continue;
    if (STOP_WORDS.has(token)) continue;
    set.add(token);
  }
  return set;
}

/** Jaccard similarity between two token sets. */
function jaccard(a: TokenSet, b: TokenSet): number {
  let intersection = 0;
  for (const t of a) {
    if (b.has(t)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Parse the first two CSV fields (hts8, brief_description) from a line, taking
 * quoted fields into account. Returns null if parsing fails.
 */
function parseLine(line: string): { code: string; description: string } | null {
  let field = '';
  const fields: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      fields.push(field);
      field = '';
      if (fields.length === 2) break; // we only need first two
    } else {
      field += c;
    }
  }
  // Push last collected field if we exited early (<2)
  if (fields.length < 2) fields.push(field);
  if (fields.length < 2) return null;
  const [code, description] = fields;
  // Sanity check: code should be digits
  if (!/^[0-9]{6,8}$/.test(code)) return null;
  return { code, description: description.replace(/^\"|\"$/g, '') };
}

function buildSemanticDB(
  csvPath: string,
  threshold: number = DEFAULT_THRESHOLD,
  topN: number = DEFAULT_TOP_N,
): SemanticDB {
  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/);

  // Skip header (assumed first line)
  const items: HTSItem[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const rec = parseLine(lines[i]);
    if (!rec) continue;
    const tokens = tokenize(rec.description);
    items.push({
      code: rec.code,
      chapter: rec.code.slice(0, 2),
      description: rec.description,
      tokens,
    });
  }

  // Build inverted index token -> set of item indices
  const tokenIndex: Record<string, number[]> = {};
  items.forEach((item, idx) => {
    for (const tok of item.tokens) {
      if (!tokenIndex[tok]) tokenIndex[tok] = [];
      tokenIndex[tok].push(idx);
    }
  });

  const db: SemanticDB = {};

  items.forEach((item, idx) => {
    const candidateIdxSet = new Set<number>();
    for (const tok of item.tokens) {
      for (const j of tokenIndex[tok]) {
        if (j !== idx) candidateIdxSet.add(j);
      }
    }

    const candidates: Link[] = [];
    candidateIdxSet.forEach((j) => {
      const other = items[j];
      if (other.chapter === item.chapter) return; // cross-chapter only
      const score = jaccard(item.tokens, other.tokens);
      if (score >= threshold) {
        candidates.push({ code: other.code, score: Number(score.toFixed(3)) });
      }
    });

    candidates.sort((a, b) => b.score - a.score);
    db[item.code] = candidates.slice(0, topN);
  });

  return db;
}

function main() {
  const [csvPath, outPath] = process.argv.slice(2);
  if (!csvPath || !outPath) {
    /* eslint-disable no-console */
    console.error('Usage: ts-node scripts/generateSemanticDB.ts <input.csv> <output.json>');
    process.exit(1);
  }

  console.log(`Generating semantic links from ${csvPath} ...`);
  const db = buildSemanticDB(csvPath);
  fs.writeFileSync(outPath, JSON.stringify(db, null, 2), 'utf8');
  console.log(`Semantic database written to ${outPath}`);
}

if (require.main === module) {
  main();
}