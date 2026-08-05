/**
 * Compare the live Appwrite content against data/seed-data.json.
 *
 * Why this exists: `npm test` builds in mock mode, so every check reads
 * seed-data.json directly. That makes the suite blind to the one failure mode
 * that actually bit us — the repo being correct while the deployed database
 * still served older copy. A green test run said nothing about production.
 *
 * Only public content tables are compared. User tables are never read: the
 * server key could read them, and a routine developer command must not.
 *
 * Exit 0 = live matches the repo. Exit 1 = drift, run `npm run db:seed`.
 */
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { Client, TablesDB, Query } from 'node-appwrite';

const seed = JSON.parse(await readFile(new URL('../data/seed-data.json', import.meta.url)));

// Public content only. Rows are lined up by $id because that is exactly what
// seed.mjs upserts on — any other key is a guess about the schema, and two of
// my first guesses were wrong field names that silently collapsed whole tables.
const TABLES = [
  'source_registry',
  'population_context',
  'mortality_context',
  'factor_prevalence',
  'action_content',
];
const keyOf = (row) => row.$id;

const { APPWRITE_ENDPOINT, APPWRITE_PROJECT, APPWRITE_API_KEY, VITE_APPWRITE_DB } = process.env;
const DB = VITE_APPWRITE_DB || 'kirasihat';

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT || !APPWRITE_API_KEY) {
  console.error('Missing APPWRITE_ENDPOINT / APPWRITE_PROJECT / APPWRITE_API_KEY in .env');
  process.exit(1);
}

const tablesDB = new TablesDB(
  new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT)
    .setKey(APPWRITE_API_KEY)
);

/** Appwrite bookkeeping fields are not content; ignore them when comparing. */
// $id is stripped from the *content* diff (it is identity, not content) but the
// key is taken from the raw row before stripping — getting that backwards made
// every source_registry row collapse onto the key `undefined`, so six of seven
// rows were silently never compared.
const META = /^\$(id|sequence|createdAt|updatedAt|permissions|databaseId|tableId|collectionId)$/;

// Appwrite returns "...+00:00" where the seed file writes "...Z". Same instant,
// different spelling. Compare the instant, not the text, or every datetime
// column reports drift forever and the real drift gets lost in the noise.
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/;
const norm = (v) => {
  if (typeof v !== 'string' || !ISO.test(v)) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toISOString();
};

const content = (row) =>
  Object.fromEntries(
    Object.entries(row)
      .filter(([k]) => !META.test(k))
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => [k, norm(v)])
      .sort(([a], [b]) => a.localeCompare(b))
  );

const listAll = async (tableId) => {
  const out = [];
  let cursor = null;
  for (;;) {
    const queries = [Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const page = await tablesDB.listRows({ databaseId: DB, tableId, queries });
    out.push(...page.rows);
    if (page.rows.length < 100) break;
    cursor = page.rows[page.rows.length - 1].$id;
  }
  return out;
};

let problems = 0;

/** Key from the raw row, content from the stripped row. Fails loudly if the
 *  key function does not actually distinguish rows — a silent collapse here
 *  would make the whole check pass while comparing almost nothing. */
const index = (rows, keyOf, table, side) => {
  const map = new Map();
  for (const raw of rows) {
    const key = keyOf(raw);
    if (key === undefined || key === null || String(key).includes('undefined')) {
      throw new Error(`${table}: key function returned "${key}" for a ${side} row — check TABLES`);
    }
    if (map.has(key)) throw new Error(`${table}: duplicate key "${key}" in ${side} rows`);
    map.set(key, content(raw));
  }
  return map;
};

for (const table of TABLES) {
  let wantByKey;
  let liveByKey;
  try {
    wantByKey = index(seed[table] ?? [], keyOf, table, 'repo');
    liveByKey = index(await listAll(table), keyOf, table, 'live');
  } catch (err) {
    console.error(`  ERROR ${table}: ${err.message}`);
    problems += 1;
    continue;
  }

  const lines = [];

  for (const [key, w] of wantByKey) {
    const l = liveByKey.get(key);
    if (!l) { lines.push(`    missing in live: ${key}`); continue; }
    for (const field of new Set([...Object.keys(w), ...Object.keys(l)])) {
      if (JSON.stringify(w[field]) !== JSON.stringify(l[field])) {
        const show = (v) => {
          const s = typeof v === 'string' ? v : JSON.stringify(v ?? null);
          return s.length > 70 ? `${s.slice(0, 70)}…` : s;
        };
        lines.push(`    ${key} · ${field}\n      repo: ${show(w[field])}\n      live: ${show(l[field])}`);
      }
    }
  }
  for (const key of liveByKey.keys()) {
    if (!wantByKey.has(key)) lines.push(`    extra in live (seed would prune): ${key}`);
  }

  if (lines.length === 0) {
    console.log(`  OK   ${table} — ${liveByKey.size} rows match`);
  } else {
    problems += lines.length;
    console.log(`  DRIFT ${table}`);
    lines.forEach((l) => console.log(l));
  }
}

console.log('');
if (problems > 0) {
  console.log(`${problems} difference(s). The deployed app is not serving what this repo says.`);
  console.log('Fix with:  npm run db:seed');
  process.exit(1);
}
console.log('Live content matches the repo seed.');
