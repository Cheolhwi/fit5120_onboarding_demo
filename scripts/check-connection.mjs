#!/usr/bin/env node
/**
 * Preflight check for the Appwrite connection.
 *
 *   npm run db:check
 *
 * Run this BEFORE db:setup. It tells you exactly which piece of the
 * configuration is wrong instead of leaving you to decode a 401.
 */
import 'dotenv/config';
import { Client, TablesDB } from 'node-appwrite';
import { DB_ID, TABLES } from './schema.mjs';

const { APPWRITE_ENDPOINT, APPWRITE_PROJECT, APPWRITE_API_KEY } = process.env;

const ok = (m) => console.log(`  ok    ${m}`);
const bad = (m, fix) => {
  console.log(`  FAIL  ${m}`);
  if (fix) console.log(`        -> ${fix}`);
};

function fail(msg, fix) {
  bad(msg, fix);
  process.exit(1);
}

console.log('\nChecking Appwrite configuration...\n');

/* 1 — env vars present ---------------------------------------------------- */
{
  const need = {
    APPWRITE_ENDPOINT,
    APPWRITE_PROJECT,
    APPWRITE_API_KEY,
  };
  const empty = Object.entries(need)
    .filter(([, v]) => !v || !String(v).trim())
    .map(([k]) => k);

  if (empty.length) {
    console.log('  FAIL  These variables are empty in .env:');
    for (const k of empty) console.log(`          ${k}`);
    if (empty.includes('APPWRITE_API_KEY')) {
      console.log(
        '\n        Create one at: Overview > Integration > API keys > Create API key\n' +
          '        Grant all ten Database scopes (databases/tables/columns/indexes/rows,\n' +
          '        read and write). Then set APPWRITE_API_KEY=standard_... in .env\n' +
          '        with no quotes, no spaces around "=", and no inline comment.'
      );
    }
    process.exit(1);
  }
}
ok('.env loaded — all three server variables set');

/* 2 — endpoint shape ------------------------------------------------------ */
if (!/^https:\/\/.+\/v1\/?$/.test(APPWRITE_ENDPOINT)) {
  fail(
    `Endpoint looks wrong: ${APPWRITE_ENDPOINT}`,
    'It must end in /v1, e.g. https://syd.cloud.appwrite.io/v1 (region matters)'
  );
}
ok(`endpoint ${APPWRITE_ENDPOINT}`);

if (APPWRITE_API_KEY.startsWith('standard_') === false && APPWRITE_API_KEY.length < 40) {
  bad('API key looks unusually short', 'Did you paste the Project ID into APPWRITE_API_KEY by mistake?');
}

const tablesDB = new TablesDB(
  new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT)
    .setKey(APPWRITE_API_KEY)
);

/* 3 — can we reach the project at all? ------------------------------------ */
let databases;
try {
  databases = await tablesDB.list();
  ok(`project ${APPWRITE_PROJECT} reachable — ${databases.total} database(s)`);
} catch (err) {
  const code = err?.code;
  if (code === 401) {
    fail(
      'Authentication failed (401)',
      'The API key is wrong, expired, or missing the databases.read scope. ' +
        'Overview > Integration > API keys.'
    );
  }
  if (code === 404) {
    fail(
      'Project not found (404)',
      'Check APPWRITE_PROJECT, and make sure the endpoint region matches the project region.'
    );
  }
  if (/fetch failed|ENOTFOUND|ECONNREFUSED/i.test(err?.message || '')) {
    fail(`Cannot reach ${APPWRITE_ENDPOINT}`, 'Typo in the endpoint, or no internet connection.');
  }
  fail(`Unexpected error: ${err?.message}`, 'Full error above.');
}

/* 4 — required scopes ----------------------------------------------------- */
// createTable writes columns and indexes inline, so those scopes are needed too.
const REQUIRED_SCOPES = [
  'databases.read', 'databases.write',
  'tables.read', 'tables.write',
  'columns.read', 'columns.write',
  'indexes.read', 'indexes.write',
  'rows.read', 'rows.write',
];

const probe = async (label, fn) => {
  try {
    await fn();
    return true;
  } catch (err) {
    if (err?.code === 401) {
      bad(`missing scope for ${label}`, 'Add all 10 Database scopes to the API key.');
      return false;
    }
    return true; // 404 just means "not created yet" — that is fine here
  }
};

let scopesOk = true;
scopesOk &= await probe('tables.read', () => tablesDB.listTables({ databaseId: DB_ID }));
if (scopesOk) ok('database scopes look sufficient');

/* 5 — schema state -------------------------------------------------------- */
const dbExists = databases.databases?.some((d) => d.$id === DB_ID);
if (!dbExists) {
  console.log(`\n  note  database "${DB_ID}" does not exist yet — run: npm run db:setup`);
} else {
  const existing = await tablesDB.listTables({ databaseId: DB_ID });
  const have = new Set(existing.tables.map((t) => t.$id));
  const want = TABLES.map((t) => t.id);
  const missing = want.filter((id) => !have.has(id));

  ok(`database "${DB_ID}" exists — ${have.size}/${want.length} tables`);
  if (missing.length) {
    console.log(`  note  missing tables: ${missing.join(', ')} — run: npm run db:setup`);
  } else {
    // Are they seeded?
    let empty = [];
    for (const id of ['source_registry', 'mortality_context', 'action_content']) {
      const rows = await tablesDB.listRows({ databaseId: DB_ID, tableId: id });
      if (rows.total === 0) empty.push(id);
    }
    if (empty.length) {
      console.log(`  note  empty tables: ${empty.join(', ')} — run: npm run db:seed`);
    } else {
      ok('seed data present');
    }
  }
}

/* 6 — frontend vars ------------------------------------------------------- */
console.log('\nFrontend variables (used by the browser, safe to be public):');
for (const key of ['VITE_APPWRITE_ENDPOINT', 'VITE_APPWRITE_PROJECT']) {
  process.env[key] ? ok(`${key} set`) : bad(`${key} not set`, 'Add it to .env for npm run dev');
}
if (process.env.VITE_APPWRITE_PROJECT && process.env.VITE_APPWRITE_PROJECT !== APPWRITE_PROJECT) {
  bad(
    'VITE_APPWRITE_PROJECT does not match APPWRITE_PROJECT',
    'The frontend and the scripts would talk to different projects.'
  );
}

console.log(
  '\nReminder: the browser also needs a Web platform registered in\n' +
    'Settings > Platforms with hostname "localhost" (dev) and\n' +
    '"<your-username>.github.io" (production). This script cannot check that —\n' +
    'CORS is enforced by the browser, not by the API.\n'
);
