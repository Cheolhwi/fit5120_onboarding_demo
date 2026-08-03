#!/usr/bin/env node
/**
 * Loads data/seed-data.json into Appwrite.
 * Idempotent: an existing row with the same id is updated, not duplicated.
 *
 *   node scripts/seed.mjs
 *
 * Before writing anything it checks that every source_id referenced by a
 * content row actually exists in source_registry. Appwrite does not enforce
 * foreign keys on varchar columns, so this script is where that guarantee
 * lives — a release with a dangling source reference fails closed.
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Client, TablesDB } from 'node-appwrite';
import { DB_ID, SEED_ORDER } from './schema.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(HERE, '..', 'data', 'seed-data.json'), 'utf8'));

const { APPWRITE_ENDPOINT, APPWRITE_PROJECT, APPWRITE_API_KEY } = process.env;
if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT || !APPWRITE_API_KEY) {
  console.error('Missing env vars — see .env.example');
  process.exit(1);
}

const tablesDB = new TablesDB(
  new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT)
    .setKey(APPWRITE_API_KEY)
);

/** Referential integrity gate. */
function checkSources() {
  const known = new Set(data.source_registry.map((r) => r.$id));
  const dangling = [];
  for (const table of SEED_ORDER) {
    if (table === 'source_registry') continue;
    for (const row of data[table] ?? []) {
      if (row.source_id && !known.has(row.source_id)) {
        dangling.push(`${table}/${row.$id} -> ${row.source_id}`);
      }
    }
  }
  if (dangling.length) {
    console.error('Dangling source_id references:\n  ' + dangling.join('\n  '));
    process.exit(1);
  }
  console.log(`Provenance check passed — ${known.size} sources, no dangling references.\n`);
}

/** Warn loudly about anything not yet verified against the published source. */
function reportUnverified() {
  const rows = [...(data.mortality_context ?? []), ...(data.factor_prevalence ?? [])];
  const unverified = rows.filter((r) => r.verified !== true);
  if (unverified.length) {
    console.warn(
      `WARNING: ${unverified.length} row(s) are not marked verified and will be ` +
        'hidden from users by the client filter.\n'
    );
  }
}

async function upsert(tableId, row) {
  const { $id, ...raw } = row;
  // Appwrite rejects an explicit null for an optional column — omit the key
  // instead of sending null.
  const body = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== null && v !== undefined)
  );
  try {
    await tablesDB.createRow({ databaseId: DB_ID, tableId, rowId: $id, data: body });
    return 'created';
  } catch (err) {
    if (err?.code !== 409) throw err;
    await tablesDB.updateRow({ databaseId: DB_ID, tableId, rowId: $id, data: body });
    return 'updated';
  }
}

/**
 * Delete published rows that are no longer in seed-data.json.
 *
 * seed-data.json is the curated release: what is not in it must not be live.
 * Without this, a renamed or retired row lingers in the database and can still
 * be served to users. Only the public content tables are pruned — user rows are
 * never touched by this script.
 */
async function prune(tableId, keepIds) {
  const res = await tablesDB.listRows({ databaseId: DB_ID, tableId, queries: [] });
  const stale = res.rows.filter((r) => !keepIds.has(r.$id));
  for (const row of stale) {
    await tablesDB.deleteRow({ databaseId: DB_ID, tableId, rowId: row.$id });
  }
  return stale.map((r) => r.$id);
}

async function main() {
  console.log(`Seeding ${DB_ID} at ${APPWRITE_ENDPOINT}\n`);
  checkSources();
  reportUnverified();

  for (const tableId of SEED_ORDER) {
    const rows = data[tableId] ?? [];
    let created = 0;
    let updated = 0;
    for (const row of rows) {
      const result = await upsert(tableId, row);
      result === 'created' ? created++ : updated++;
    }
    const removed = await prune(tableId, new Set(rows.map((r) => r.$id)));
    const tail = removed.length ? `, ${removed.length} removed (${removed.join(', ')})` : '';
    console.log(`  ${tableId.padEnd(20)} ${created} created, ${updated} updated${tail}`);
  }

  console.log('\nSeed complete.');
  console.log('Reminder: mortality_context holds only the rows your team has verified');
  console.log('against DOSM (R1). Completing the top-5 causes is an open task.');
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
