/**
 * KiraSihat table definitions.
 *
 * Implements the logical data model from deliverables/need_to_handoff/
 * Data_Management_Plan §3.3, plus one table (factor_prevalence) that the
 * implementation showed was missing — see README "Deviation from the ERD".
 *
 * Column types are deliberately limited to the set Appwrite server 1.9.x
 * accepts inline in createTable:
 *
 *   string(size) | integer | float | boolean | datetime | enum
 *
 * Newer Appwrite releases split `string` into varchar/text/mediumtext/longtext
 * and the public docs show those names — but 1.9.5 rejects them with
 * "Invalid type for attribute 'x': varchar". Check your server version in the
 * console footer before changing these.
 */
import { Permission, Role } from 'node-appwrite';

/** Short helper so the table definitions stay readable. */
const str = (key, size, required = false) => ({ key, type: 'string', size, required });

// Public reference content: readable by anyone, written only with an API key.
const PUBLIC_READ = [Permission.read(Role.any())];

// Private user rows: no table-level grants at all. Permissions are attached
// per row at creation time, so a row is reachable only by its owner.
const OWNER_ONLY = [Permission.create(Role.users())];

export const DB_ID = 'kirasihat';
export const DB_NAME = 'KiraSihat';

export const TABLES = [
  {
    id: 'source_registry',
    name: 'Source registry',
    permissions: PUBLIC_READ,
    rowSecurity: false,
    columns: [
      str('owner', 200, true),
      str('title', 400, true),
      str('canonical_url', 500, true),
      str('licence', 200, true),
      { key: 'publication_date', type: 'datetime', required: false },
      { key: 'retrieved_at', type: 'datetime', required: true },
      str('caveat_en', 1000),
      str('caveat_ms', 1000),
    ],
    indexes: [{ key: 'idx_owner', type: 'key', attributes: ['owner'] }],
  },

  {
    id: 'population_context',
    name: 'Population context',
    permissions: PUBLIC_READ,
    rowSecurity: false,
    columns: [
      str('source_id', 20, true),
      { key: 'year', type: 'integer', required: true },
      str('age_band', 12, true),
      str('sex', 10),
      { key: 'population_thousands', type: 'float', required: false },
      { key: 'is_published_band', type: 'boolean', required: true },
    ],
    indexes: [
      { key: 'idx_band_year', type: 'key', attributes: ['age_band', 'year'] },
      { key: 'idx_published', type: 'key', attributes: ['is_published_band'] },
    ],
  },

  {
    id: 'mortality_context',
    name: 'Mortality context',
    permissions: PUBLIC_READ,
    rowSecurity: false,
    columns: [
      str('source_id', 20, true),
      { key: 'year', type: 'integer', required: true },
      str('age_band', 12, true),
      str('sex_scope', 10),
      str('cause_en', 200, true),
      str('cause_ms', 200),
      { key: 'count', type: 'integer', required: true },
      { key: 'share_pct', type: 'float', required: false },
      { key: 'rank', type: 'integer', required: false },
      str('topic', 40),
      str('denominator_note_en', 1000),
      str('denominator_note_ms', 1000),
      // Guards against unreviewed rows reaching users. The client filters on it.
      { key: 'verified', type: 'boolean', required: true },
    ],
    indexes: [
      { key: 'idx_band_year_rank', type: 'key', attributes: ['age_band', 'year', 'rank'] },
      { key: 'idx_verified', type: 'key', attributes: ['verified'] },
    ],
  },

  {
    // NOT in the documented ERD — added during implementation. See README.
    id: 'factor_prevalence',
    name: 'Changeable factor prevalence',
    permissions: PUBLIC_READ,
    rowSecurity: false,
    columns: [
      str('source_id', 20, true),
      { key: 'year', type: 'integer', required: true },
      str('scope', 120, true),
      str('label_en', 120, true),
      str('label_ms', 120),
      { key: 'pct', type: 'float', required: true },
      str('topic', 40),
      { key: 'rank', type: 'integer', required: false },
      { key: 'verified', type: 'boolean', required: true },
    ],
    indexes: [{ key: 'idx_rank', type: 'key', attributes: ['rank'] }],
  },

  {
    id: 'action_content',
    name: 'Action content',
    permissions: PUBLIC_READ,
    rowSecurity: false,
    columns: [
      str('action_key', 40, true),
      str('topic', 40, true),
      { key: 'language', type: 'enum', elements: ['en', 'ms'], required: true },
      str('title', 200, true),
      str('reason', 1000, true),
      str('first_step', 1000, true),
      str('safety_note', 1000, true),
      { key: 'effort', type: 'enum', elements: ['low', 'medium', 'high'], required: true },
      str('source_id', 20, true),
      { key: 'review_status', type: 'enum', elements: ['draft', 'approved', 'retired'], required: true },
      { key: 'sort_order', type: 'integer', required: false },
    ],
    indexes: [
      { key: 'idx_lang_status', type: 'key', attributes: ['language', 'review_status'] },
      { key: 'idx_topic', type: 'key', attributes: ['topic'] },
    ],
  },

  {
    id: 'user_profile',
    name: 'User profile',
    permissions: OWNER_ONLY,
    rowSecurity: true,
    columns: [
      str('owner_user_id', 64, true),
      str('age_band', 12, true),
      str('sex', 10),
      str('state', 40),
      str('screening_band', 20),
      // Stored as a comma-separated list of flags. No free text, ever.
      str('lifestyle_flags', 300),
      str('consent_version', 10, true),
      { key: 'language', type: 'enum', elements: ['en', 'ms'], required: true },
    ],
    indexes: [{ key: 'idx_owner', type: 'key', attributes: ['owner_user_id'] }],
  },

  {
    id: 'user_goal',
    name: 'User goal',
    permissions: OWNER_ONLY,
    rowSecurity: true,
    columns: [
      str('owner_user_id', 64, true),
      str('action_key', 40, true),
      { key: 'target', type: 'integer', required: true },
      { key: 'progress', type: 'integer', required: true },
      { key: 'status', type: 'enum', elements: ['active', 'completed', 'stopped'], required: true },
      { key: 'reminder_opt_in', type: 'boolean', required: true },
    ],
    indexes: [{ key: 'idx_owner_status', type: 'key', attributes: ['owner_user_id', 'status'] }],
  },

  {
    id: 'audit_event',
    name: 'Audit event',
    // No public read. Server-side key only — the browser never touches this.
    permissions: [],
    rowSecurity: false,
    columns: [
      str('actor_role', 40, true),
      str('action', 60, true),
      str('object_type', 40, true),
      str('object_id_hash', 64, true),
      str('result', 20, true),
      { key: 'occurred_at', type: 'datetime', required: true },
    ],
    indexes: [{ key: 'idx_occurred', type: 'key', attributes: ['occurred_at'] }],
  },
];

/** Tables that get seeded from data/seed-data.json, in dependency order. */
export const SEED_ORDER = [
  'source_registry',
  'population_context',
  'mortality_context',
  'factor_prevalence',
  'action_content',
];
