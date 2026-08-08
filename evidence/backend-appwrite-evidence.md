# KiraSihat backend and Appwrite completion evidence

Verified on **7 August 2026** against local `main` commit `6319879` and the live Appwrite project.

## Environment verified

- Endpoint: `https://sgp.cloud.appwrite.io/v1`
- Project: `6a707f1300026de996cc`
- Database: `kirasihat`
- Deployment: https://cheolhwi.github.io/fit5120_onboarding_demo/
- Appwrite console: https://cloud.appwrite.io/console/organization-6a707eaa2cb208670bec#

## Connection and schema result

`npm run db:check` completed successfully:

- `.env` loaded and all three server variables were present.
- The Appwrite endpoint and project were reachable.
- Database scopes were sufficient.
- The `kirasihat` database contained **8/8 expected tables**.
- Required seed data was present.
- Public browser variables `VITE_APPWRITE_ENDPOINT` and `VITE_APPWRITE_PROJECT` were set.

## Live-data drift result

`npm run db:drift` completed successfully. Live Appwrite content matched the repository seed exactly:

- `source_registry`: 7 rows matched
- `population_context`: 4 rows matched
- `mortality_context`: 8 rows matched
- `factor_prevalence`: 4 rows matched
- `action_content`: 6 rows matched

Result: **0 content differences**.

## Backend behaviour verified

- Only the approved minimum profile fields are stored; the Appwrite anonymous session owns the identity.
- Published age bands map to verified DOSM records; unavailable data is not invented.
- Statistics and actions resolve their publisher, title, canonical link, licence, year and caveat from the source registry.
- Only approved actions are returned, matched actions are ranked first, and the result is limited to three.
- WHO physical-activity guidance remains linked to its reviewed source.
- Saving an action creates one owner-scoped active goal with the correct habit or one-off defaults.
- Reminder opt-in defaults to off and can be persisted on and off without changing other goal fields.
- Live anonymous-session testing confirmed save, target edit, progress update, reminder update, completion/stop behaviour, and owner-scoped deletion.
- The synthetic verification profile and goal were deleted after the run.

## Supporting automated result

The built application test suite completed with **108/108 checks passed** and no uncaught runtime errors.

