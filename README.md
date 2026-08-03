# KiraSihat — Iteration 1 MVP

Turning official Malaysian mortality data into one safe preventive action.
FIT5120 S2 2026 · Team Dynamics (TM01) · SDG 3 Good Health and Well-being.

**Scope guardrail.** Population context and general preventive guidance only.
No diagnosis, no treatment advice, and no personal risk percentage anywhere in
the product. This is a design constraint, not a disclaimer — see
[Why there is no risk score](#why-there-is-no-risk-score).

---

## What is built

All 17 Must-have features from
`deliverables/need_to_handoff/Iteration_1_Design_Artefacts.docx` §5.2.

| Screen | Features | User story |
|---|---|---|
| 1 · Context profile | F01 age band · F02 lifestyle checklist · F03 consent gate | US 1.1 |
| 2 · Official context | F04 band mapping · F05 leading cause · F06 plain explanation · F07 source label · F08 not-a-diagnosis | US 1.2 |
| 3 · Choose one action | F09 action catalogue · F10 safe-start note · F11 safety + urgent route | US 2.1 |
| 4 · Plan and screening | F12 MySejahtera link · F13 clinician questions · F14 weekly goal · F15 no forced streak · F16 delete my data | US 2.2 |
| All screens | F17 BM/EN toggle and accessible display | cross-epic |

`npm test` verifies every one of them against the built bundle (39 checks).

---

## Architecture

```
Browser ──────► GitHub Pages        static HTML/CSS/JS only
   │
   └──────────► Appwrite Cloud      TablesDB + Auth (separate service)
```

GitHub Pages cannot run server code. There is no server of ours: the browser
talks to Appwrite directly, and Appwrite's row permissions are what make that
safe. Screens 1–3 are fully anonymous and write nothing; a session is created
only when the user saves a goal on screen 4.

`src/lib/db.js` is the **only** file that imports the Appwrite SDK. If the SDK
changes again, that is the one file to fix.

---

## Setup

### 1. Appwrite project

1. Create a project at <https://cloud.appwrite.io>.
2. **Settings → Platforms → Add platform → Web app.** Hostname `localhost` for
   development, and `<your-username>.github.io` for production.
   Skipping this causes every request to fail with a CORS error — it is the
   single most common setup mistake.
3. **Overview → Integration → API keys → Create API key.** Grant **all ten
   Database scopes** — `databases.read/write`, `tables.read/write`,
   `columns.read/write`, `indexes.read/write`, `rows.read/write`.
   `createTable` writes columns and indexes inline, so `databases.*` alone
   returns 401 partway through setup. This key is for the seed scripts only and
   must never reach the frontend.
4. Note your region-specific endpoint, e.g. `https://syd.cloud.appwrite.io/v1`.
   The region is part of the URL — a Sydney project will 404 on the Frankfurt
   endpoint.

### 2. Environment

```bash
cp .env.example .env
# fill in VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT
# and APPWRITE_ENDPOINT, APPWRITE_PROJECT, APPWRITE_API_KEY
```

Anything prefixed `VITE_` is compiled into the public bundle and is readable by
anyone. That is expected. `APPWRITE_API_KEY` has no prefix on purpose.

### 3. Create tables and load data

```bash
npm install
npm run db:check    # preflight — tells you which setting is wrong, if any
npm run db:setup    # creates the database and 8 tables with columns + indexes
npm run db:seed     # loads data/seed-data.json
```

`db:check` is worth running first. It distinguishes a wrong endpoint region
(404) from a wrong key or missing scope (401) from a network problem, and
reports how far the schema has got.

Both are idempotent. `npm run db:reset` drops and rebuilds everything.

The seed script refuses to run if any content row references a `source_id` that
is not in `source_registry` — Appwrite does not enforce foreign keys on varchar
columns, so that guarantee lives in the script.

### 4. Run

```bash
npm run dev          # http://localhost:5173
npm run build        # production bundle
npm test             # build in mock mode + 39 feature checks
```

**Mock mode** (`VITE_MOCK=1`, or `npm run dev -- --mode mock`) runs the entire
UI off `data/seed-data.json` with no backend at all. Useful for UI work and as a
fallback if the Appwrite project is unreachable during a demo.

---

## Deploying to GitHub Pages

1. **Settings → Pages → Source: GitHub Actions.**
2. **Settings → Secrets and variables → Actions → Variables**, add:
   `VITE_APPWRITE_ENDPOINT`, `VITE_APPWRITE_PROJECT`, `VITE_APPWRITE_DB`.
   Use *Variables*, not *Secrets* — these are public values and secrets are
   masked in a way that breaks the build output.
3. Push to `main`.

Two Pages-specific things the workflow already handles:

- **Base path.** A project site lives at `/<repo>/`, not the domain root, so the
  build sets `VITE_BASE`. Without it the bundle 404s in production while working
  perfectly on localhost.
- **SPA fallback.** Pages has no rewrite rules, so `index.html` is copied to
  `404.html`.

---

## Data model

Eight tables. Seven come from the Data Management Plan §3.3; the eighth is
noted below.

| Table | Classification | Access |
|---|---|---|
| `source_registry` | Public metadata | Public read |
| `population_context` | Public derived facts | Public read |
| `mortality_context` | Public derived facts | Public read |
| `factor_prevalence` | Public derived facts | Public read |
| `action_content` | Public curated content | Public read |
| `user_profile` | Sensitive personal | Owner only, row-level |
| `user_goal` | Personal | Owner only, row-level |
| `audit_event` | Restricted operational | Server key only |

Private tables have **no table-level read grant at all**. Permissions are
attached per row at creation time, so a row is unreachable by anyone but its
creator even if they guess the row ID.

### Deviation from the documented ERD

`factor_prevalence` is **not** in the ERD in the Analysis & Design Report or the
Data Management Plan. Screen 2 needs NHMS prevalence figures (cholesterol,
inactivity, hypertension, diabetes) to bridge from "what people die of" to "what
you can change", and none of the seven documented tables is the right home for
them — they are not mortality, not population denominators, and not action
content.

**Action required:** add this table to the ERD before the next handoff, or
decide to fold it into `mortality_context` with a type discriminator. Either is
defensible; leaving the documentation and the schema disagreeing is not.

### Data completeness

`mortality_context` holds **eight verified rows**, all from the DOSM release
page (R1), checked 3 August 2026:

| Age band | Principal cause | Deaths | Share |
|---|---|---|---|
| 0–14 | Pneumonia | 244 | 5.6% |
| 15–40 | Transport accidents | 2,547 | 20.0% |
| 41–59 | Ischaemic heart disease | 5,380 | 17.6% |
| 60+ | Pneumonia | 11,989 | 13.9% |
| all ages | Ischaemic heart disease · Pneumonia · Diabetes · Transport accidents | 17,421 / 15,332 / 6,929 / 4,428 | 13.0 / 11.5 / 5.2 / 3.3% |

Every row carries a `verified` boolean and the client filters on it, so
unverified rows never reach a user.

**Still missing: causes ranked 2nd–5th within 41–59.** The DOSM release summary
publishes only the *principal* cause per age band; the full age × cause
cross-tabulation is not in the public overview. Request it via DOSM eStatistik
(`data[at]dosm.gov.my`) or extract it from the detailed publication tables.

Do **not** infer that ordering from the national all-ages ranking. Pneumonia is
2nd nationally across all ages, but that is dominated by the 60+ band and does
not establish its rank within 41–59. `data/seed-data.json` carries a
`_data_gaps` block stating this.

### Seeding is declarative

`db:seed` upserts every row in `seed-data.json` **and deletes published rows
that are no longer in it**. The JSON is the curated release: what is not in it
is not live. Only the five public content tables are pruned — `user_profile`,
`user_goal` and `audit_event` are never touched by the seed script.

---

## Why there is no risk score

A clinical risk score scored **7/20** in the opportunity prioritisation: high
desirability, very low evidence, feasibility and safety confidence.

The decision is enforced structurally, not by a note in a document:

- There is no `risk_score` table.
- There is no foreign key between `user_profile` and `mortality_context`. The
  profile is a display filter over aggregate data. Joining a person to mortality
  records would imply an individual prediction the sources cannot support.
- `npm test` includes a safety sweep that fails the build if any personal risk
  claim appears anywhere in the flow.

Adding a score later requires a model card, representative validation data,
calibration and fairness evidence, a named clinical owner, hazard analysis and
explicit approval.

---

## Project layout

```
data/seed-data.json         all seed content, single source of truth
scripts/schema.mjs          table definitions (columns, indexes, permissions)
scripts/setup-tables.mjs    creates database + tables      (server API key)
scripts/seed.mjs            loads seed data + provenance check (server API key)
scripts/smoke-test.mjs      39 feature checks against the built bundle
src/lib/db.js               THE only file that touches Appwrite
src/lib/bandMap.js          40–49 → closest published band (41–59)
src/i18n.js                 BM / EN strings
src/screens/               four screens, one per user story
src/components/common.jsx   AppBar, SourceChip, NotDiagnosisBanner, Bar, NavBar
```

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Blank page, CORS errors in console | Hostname not registered | Settings → Platforms → Add Web app. `localhost` for dev, `<user>.github.io` for production. Both are needed, separately. |
| `Invalid type for attribute 'x': varchar` | Server is older than the docs | Column types are created via the SDK's per-type methods in `setup-tables.mjs`, never as inline strings. Do not "simplify" that back to a `columns` array. |
| `401` during `db:setup` | API key missing a scope | All ten Database scopes are required, not just `databases.*`. |
| `404` on connect | Endpoint region ≠ project region | Copy the endpoint from the project's Settings page verbatim. |
| Screen 2 shows the "no verified data" notice | `mortality_context` has no row with `verified: true` for that band | Expected until the DOSM extract is completed. Not a bug. |

`npm run db:check` diagnoses the first four automatically.

### Appwrite version sensitivity

This was built against **server 1.9.5**. Two things bit us and will bite again on
a different version:

1. **Column type names.** The public docs describe `varchar`/`text`/`mediumtext`,
   but 1.9.5 only accepts the older internal names (`string`, `double`).
   `setup-tables.mjs` sidesteps this entirely by calling `createStringColumn`,
   `createFloatColumn` and friends — versioned endpoints with no type-name
   guessing. Keep it that way.
2. **Columns provision asynchronously.** An index cannot be created until every
   column it references reports `available`. `setup-tables.mjs` polls
   `listColumns` before creating indexes.

## SDK versions

Built and tested against `appwrite@26` (web) and `node-appwrite@27` (server).

Appwrite renamed Databases/Collections/Documents to **TablesDB/Tables/Rows**;
older tutorials and older SDK majors will not match this code. If you upgrade
and something breaks, the blast radius is `src/lib/db.js`, `scripts/schema.mjs`
and the two seed scripts.

## Known gaps

- `audit_event` has a schema but nothing writes to it yet. Writes must happen
  server-side (an Appwrite Function), because the browser must not be able to
  forge audit rows.
- Reminders are stored as an opt-in flag; no message is actually sent.
- Only English and Bahasa Melayu content is seeded.
- Not yet reviewed by a clinician or public-health professional. Required before
  real users see the action content.
