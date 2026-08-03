/**
 * The ONLY file that talks to Appwrite.
 *
 * Everything else in src/ imports from here. If the Appwrite SDK changes its
 * API again (Databases/Collections/Documents became TablesDB/Tables/Rows), this
 * is the single file to fix.
 *
 * Set VITE_MOCK=1 to run the whole app off data/seed-data.json with no backend.
 * Useful for local UI work and for demoing when the Appwrite project is down.
 */
import { Client, TablesDB, Account, Query, ID, Permission, Role } from 'appwrite';
import mock from '../../data/seed-data.json';

const MOCK = import.meta.env.VITE_MOCK === '1';
const DB_ID = import.meta.env.VITE_APPWRITE_DB || 'kirasihat';
const CONSENT_VERSION = '2026-08-v1';

let tablesDB = null;
let account = null;
let configError = null;

if (!MOCK) {
  const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
  const project = import.meta.env.VITE_APPWRITE_PROJECT;

  // Never throw at module load — that kills the bundle and produces a blank
  // page with no explanation. Record the problem and let the UI report it.
  const missing = [
    !endpoint && 'VITE_APPWRITE_ENDPOINT',
    !project && 'VITE_APPWRITE_PROJECT',
  ].filter(Boolean);

  if (missing.length) {
    configError =
      `Missing build-time configuration: ${missing.join(', ')}. ` +
      'These are baked in when the bundle is built, so set them as GitHub ' +
      'Actions repository variables and re-run the build job (not just deploy).';
  } else {
    try {
      const client = new Client().setEndpoint(endpoint).setProject(project);
      tablesDB = new TablesDB(client);
      account = new Account(client);
    } catch (err) {
      configError = `Appwrite client could not be created: ${err.message}`;
    }
  }
}

export const isMock = () => MOCK;
export const getConfigError = () => configError;

/* ------------------------------------------------------------------ public reads */

/** Published age bands, used by the band mapper. */
export async function getPublishedBands() {
  if (MOCK) return mock.population_context.filter((r) => r.is_published_band);
  const res = await tablesDB.listRows({
    databaseId: DB_ID,
    tableId: 'population_context',
    queries: [Query.equal('is_published_band', true), Query.limit(50)],
  });
  return res.rows;
}

/**
 * Leading causes for a published band. Only verified rows ever reach a user.
 */
export async function getMortalityContext(publishedBand, year = 2024, limit = 5) {
  if (MOCK) {
    return mock.mortality_context
      .filter((r) => r.age_band === publishedBand && r.year === year && r.verified)
      .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
      .slice(0, limit);
  }
  const res = await tablesDB.listRows({
    databaseId: DB_ID,
    tableId: 'mortality_context',
    queries: [
      Query.equal('age_band', publishedBand),
      Query.equal('year', year),
      Query.equal('verified', true),
      Query.orderAsc('rank'),
      Query.limit(limit),
    ],
  });
  return res.rows;
}

/** Prevalence of factors a person can actually change. */
export async function getFactorPrevalence(limit = 4) {
  if (MOCK) {
    return mock.factor_prevalence
      .filter((r) => r.verified)
      .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
      .slice(0, limit);
  }
  const res = await tablesDB.listRows({
    databaseId: DB_ID,
    tableId: 'factor_prevalence',
    queries: [Query.equal('verified', true), Query.orderAsc('rank'), Query.limit(limit)],
  });
  return res.rows;
}

/**
 * Which action topic each lifestyle answer points at.
 *
 * Every mapping must be defensible from a source in the reference list.
 * A flag with no reviewed content gets NO topic — the UI says so rather than
 * inventing an action to make the checkbox feel responsive.
 *
 *   sedentary        -> activity   NHMS 2023: physically inactive 29.9% [R2];
 *                                  WHO adult activity guidance [R6]
 *   sugary_drinks    -> diet       NHMS 2023: diabetes prevalence 15.6% [R2]
 *   no_screening_3y  -> screening  MySejahtera targets people who "do not undergo
 *                                  any health screening in the last 3 years" [R4]
 *   smoker           -> (none)     No reviewed cessation content exists. "Quit
 *                                  support" is rated Could in the Lotus Blossom
 *                                  and needs a clinical partner before publishing.
 */
export const FLAG_TO_TOPIC = {
  sedentary: 'activity',
  sugary_drinks: 'diet',
  no_screening_3y: 'screening',
};

/** Flags the user can tick that currently have no action to offer. */
export const FLAGS_WITHOUT_ACTION = ['smoker'];

export const topicsForFlags = (flags = []) =>
  [...new Set(flags.map((f) => FLAG_TO_TOPIC[f]).filter(Boolean))];

/**
 * Approved action catalogue for one language.
 *
 * `topics` RANKS the catalogue, it does not filter it. Two reasons:
 * AC 2.1.1 requires two or three actions to be offered, and withholding general
 * preventive guidance because someone left a box unticked would be worse advice,
 * not safer advice. Matched rows are flagged so the UI can say why they are first.
 */
export async function getActions(language = 'en', topics = []) {
  let rows;
  if (MOCK) {
    rows = mock.action_content.filter(
      (r) => r.language === language && r.review_status === 'approved'
    );
  } else {
    const res = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: 'action_content',
      queries: [
        Query.equal('language', language),
        Query.equal('review_status', 'approved'),
        Query.orderAsc('sort_order'),
        Query.limit(20),
      ],
    });
    rows = res.rows;
  }

  const wanted = new Set(topics);
  return rows
    .map((r) => ({ ...r, matched: wanted.has(r.topic) }))
    .sort(
      (a, b) =>
        Number(b.matched) - Number(a.matched) ||
        (a.sort_order ?? 99) - (b.sort_order ?? 99)
    );
}

/** One source registry entry, for the source label under every figure. */
export async function getSource(sourceId) {
  if (!sourceId) return null;
  if (MOCK) return mock.source_registry.find((r) => r.$id === sourceId) ?? null;
  try {
    return await tablesDB.getRow({
      databaseId: DB_ID,
      tableId: 'source_registry',
      rowId: sourceId,
    });
  } catch {
    return null;
  }
}

/** Fetch several sources at once and return them keyed by id. */
export async function getSources(ids = []) {
  const unique = [...new Set(ids.filter(Boolean))];
  const rows = await Promise.all(unique.map(getSource));
  return Object.fromEntries(rows.filter(Boolean).map((r) => [r.$id, r]));
}

/* ------------------------------------------------------------------ session */

/**
 * A session is created only when the user saves a goal (feature F14).
 * Screens 1–3 stay fully anonymous and write nothing.
 */
export async function ensureSession() {
  if (MOCK) return { $id: 'mock-user' };
  try {
    return await account.get();
  } catch {
    await account.createAnonymousSession();
    return await account.get();
  }
}

export async function getCurrentUser() {
  if (MOCK) return localStore.get('mockUser');
  try {
    return await account.get();
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ private writes */

function ownerPerms(userId) {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
}

/** Serialise lifestyle flags — an allow-list only, never free text. */
const ALLOWED_FLAGS = ['sedentary', 'sugary_drinks', 'no_screening_3y', 'smoker'];
const packFlags = (flags = []) => flags.filter((f) => ALLOWED_FLAGS.includes(f)).join(',');
export const unpackFlags = (s) => (s ? s.split(',').filter(Boolean) : []);

/** Drop empty optional fields so Appwrite never receives an explicit null. */
const clean = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== ''));

export async function saveProfile(profile) {
  const user = await ensureSession();
  // Optional columns are omitted rather than sent as null — Appwrite rejects
  // an explicit null for a non-required column.
  const body = clean({
    owner_user_id: user.$id,
    age_band: profile.ageBand,
    sex: profile.sex,
    state: profile.state,
    screening_band: profile.screeningBand,
    lifestyle_flags: packFlags(profile.lifestyle),
    consent_version: CONSENT_VERSION,
    language: profile.language || 'en',
  });

  if (MOCK) {
    localStore.set('mockUser', user);
    const row = { $id: 'mock-profile', ...body };
    localStore.set('profile', row);
    return row;
  }

  const existing = await getProfile();
  if (existing) {
    return tablesDB.updateRow({
      databaseId: DB_ID,
      tableId: 'user_profile',
      rowId: existing.$id,
      data: body,
    });
  }
  return tablesDB.createRow({
    databaseId: DB_ID,
    tableId: 'user_profile',
    rowId: ID.unique(),
    data: body,
    permissions: ownerPerms(user.$id),
  });
}

export async function getProfile() {
  if (MOCK) return localStore.get('profile');
  const user = await getCurrentUser();
  if (!user) return null;
  const res = await tablesDB.listRows({
    databaseId: DB_ID,
    tableId: 'user_profile',
    queries: [Query.equal('owner_user_id', user.$id), Query.limit(1)],
  });
  return res.rows[0] ?? null;
}

export async function saveGoal({ actionKey, target = 5, reminder = false }) {
  const user = await ensureSession();
  const body = {
    owner_user_id: user.$id,
    action_key: actionKey,
    target,
    progress: 0,
    status: 'active',
    reminder_opt_in: reminder,
  };

  if (MOCK) {
    const row = { $id: 'mock-goal', ...body };
    localStore.set('goal', row);
    return row;
  }

  const active = await getActiveGoal();
  if (active) {
    // One goal at a time in the MVP — replace rather than accumulate.
    return tablesDB.updateRow({
      databaseId: DB_ID,
      tableId: 'user_goal',
      rowId: active.$id,
      data: body,
    });
  }
  return tablesDB.createRow({
    databaseId: DB_ID,
    tableId: 'user_goal',
    rowId: ID.unique(),
    data: body,
    permissions: ownerPerms(user.$id),
  });
}

export async function getActiveGoal() {
  if (MOCK) {
    const g = localStore.get('goal');
    return g && g.status === 'active' ? g : null;
  }
  const user = await getCurrentUser();
  if (!user) return null;
  const res = await tablesDB.listRows({
    databaseId: DB_ID,
    tableId: 'user_goal',
    queries: [
      Query.equal('owner_user_id', user.$id),
      Query.equal('status', 'active'),
      Query.limit(1),
    ],
  });
  return res.rows[0] ?? null;
}

export async function updateGoal(goalId, patch) {
  if (MOCK) {
    const row = { ...localStore.get('goal'), ...patch };
    localStore.set('goal', row);
    return row;
  }
  return tablesDB.updateRow({
    databaseId: DB_ID,
    tableId: 'user_goal',
    rowId: goalId,
    data: patch,
  });
}

/** Feature F16 — delete everything this user ever stored. */
export async function deleteMyData() {
  if (MOCK) {
    localStore.clear();
    return true;
  }
  const user = await getCurrentUser();
  if (!user) return true;

  for (const tableId of ['user_goal', 'user_profile']) {
    const res = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId,
      queries: [Query.equal('owner_user_id', user.$id), Query.limit(100)],
    });
    for (const row of res.rows) {
      await tablesDB.deleteRow({ databaseId: DB_ID, tableId, rowId: row.$id });
    }
  }
  await account.deleteSession('current');
  return true;
}

/* ------------------------------------------------------------------ mock storage */

const KEY = 'kirasihat.mock';
const localStore = {
  all() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch {
      return {};
    }
  },
  get(k) {
    return this.all()[k] ?? null;
  },
  set(k, v) {
    const all = this.all();
    all[k] = v;
    localStorage.setItem(KEY, JSON.stringify(all));
  },
  clear() {
    localStorage.removeItem(KEY);
  },
};
