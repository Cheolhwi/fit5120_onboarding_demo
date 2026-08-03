#!/usr/bin/env node
/**
 * Creates the KiraSihat database, tables, columns and indexes in Appwrite.
 * Idempotent and resumable: anything that already exists is skipped, so it is
 * safe to re-run after a partial failure.
 *
 *   node scripts/setup-tables.mjs          create
 *   node scripts/setup-tables.mjs --drop   delete every table (destructive)
 *
 * Columns are created with the SDK's dedicated per-type methods
 * (createStringColumn, createFloatColumn, ...) rather than passing a `columns`
 * array to createTable. Inline column types are named after Appwrite's internal
 * storage types, which differ per server version — 1.9.5 rejects both `varchar`
 * and `float`. The dedicated methods hit versioned endpoints and do not guess.
 *
 * Needs a SERVER API key. Never put this key in the frontend.
 */
import 'dotenv/config';
import { Client, TablesDB } from 'node-appwrite';
import { DB_ID, DB_NAME, TABLES } from './schema.mjs';

const { APPWRITE_ENDPOINT, APPWRITE_PROJECT, APPWRITE_API_KEY } = process.env;

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT || !APPWRITE_API_KEY) {
  console.error('Missing env vars — run: npm run db:check');
  process.exit(1);
}

const tablesDB = new TablesDB(
  new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT)
    .setKey(APPWRITE_API_KEY)
);

const drop = process.argv.includes('--drop');
const exists = (err) => err?.code === 409;
const missing = (err) => err?.code === 404;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** One creator per column type. Add a type here, not a string literal above. */
const COLUMN_CREATORS = {
  string: (base, c) =>
    tablesDB.createStringColumn({ ...base, key: c.key, size: c.size, required: c.required }),
  integer: (base, c) =>
    tablesDB.createIntegerColumn({ ...base, key: c.key, required: c.required }),
  float: (base, c) =>
    tablesDB.createFloatColumn({ ...base, key: c.key, required: c.required }),
  boolean: (base, c) =>
    tablesDB.createBooleanColumn({ ...base, key: c.key, required: c.required }),
  datetime: (base, c) =>
    tablesDB.createDatetimeColumn({ ...base, key: c.key, required: c.required }),
  enum: (base, c) =>
    tablesDB.createEnumColumn({ ...base, key: c.key, elements: c.elements, required: c.required }),
};

async function ensureDatabase() {
  try {
    await tablesDB.create({ databaseId: DB_ID, name: DB_NAME });
    console.log(`+ database ${DB_ID}`);
  } catch (err) {
    if (!exists(err)) throw err;
    console.log(`= database ${DB_ID}`);
  }
}

async function ensureTable(t) {
  try {
    await tablesDB.createTable({
      databaseId: DB_ID,
      tableId: t.id,
      name: t.name,
      permissions: t.permissions,
      rowSecurity: t.rowSecurity,
    });
    return 'created';
  } catch (err) {
    if (!exists(err)) throw err;
    return 'existing';
  }
}

async function ensureColumns(t) {
  const base = { databaseId: DB_ID, tableId: t.id };
  let made = 0;
  for (const c of t.columns) {
    const create = COLUMN_CREATORS[c.type];
    if (!create) throw new Error(`No creator for column type "${c.type}" (${t.id}.${c.key})`);
    try {
      await create(base, c);
      made++;
    } catch (err) {
      if (!exists(err)) {
        throw new Error(`${t.id}.${c.key} (${c.type}): ${err.message}`);
      }
    }
  }
  return made;
}

/** Columns are provisioned asynchronously; indexes need them "available". */
async function waitForColumns(t, timeoutMs = 60000) {
  const want = new Set(t.columns.map((c) => c.key));
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const { columns } = await tablesDB.listColumns({ databaseId: DB_ID, tableId: t.id });
    const mine = columns.filter((c) => want.has(c.key));
    const failed = mine.filter((c) => c.status === 'failed');
    if (failed.length) {
      throw new Error(
        `${t.id}: columns failed to provision — ${failed.map((c) => c.key).join(', ')}`
      );
    }
    if (mine.length === want.size && mine.every((c) => c.status === 'available')) return;
    await sleep(700);
  }
  throw new Error(`${t.id}: timed out waiting for columns to become available`);
}

async function ensureIndexes(t) {
  let made = 0;
  for (const ix of t.indexes ?? []) {
    try {
      await tablesDB.createIndex({
        databaseId: DB_ID,
        tableId: t.id,
        key: ix.key,
        type: ix.type,
        columns: ix.attributes,
      });
      made++;
    } catch (err) {
      if (!exists(err)) throw new Error(`${t.id} index ${ix.key}: ${err.message}`);
    }
  }
  return made;
}

async function dropTables() {
  for (const t of [...TABLES].reverse()) {
    try {
      await tablesDB.deleteTable({ databaseId: DB_ID, tableId: t.id });
      console.log(`- table ${t.id}`);
    } catch (err) {
      if (!missing(err)) throw err;
    }
  }
}

async function main() {
  console.log(`Appwrite: ${APPWRITE_ENDPOINT}  project ${APPWRITE_PROJECT}\n`);

  if (drop) {
    console.log('Dropping tables...\n');
    await dropTables();
    console.log('\nDone. Run without --drop to recreate.');
    return;
  }

  await ensureDatabase();

  for (const t of TABLES) {
    const state = await ensureTable(t);
    const cols = await ensureColumns(t);
    await waitForColumns(t);
    const idx = await ensureIndexes(t);
    const mark = state === 'created' ? '+' : '=';
    console.log(
      `${mark} ${t.id.padEnd(20)} ${t.columns.length} columns ` +
        `(${cols} new), ${(t.indexes ?? []).length} indexes (${idx} new)`
    );
  }

  console.log('\nSchema ready. Next: npm run db:seed');
}

main().catch((err) => {
  console.error('\nFailed:', err.message);
  process.exit(1);
});
