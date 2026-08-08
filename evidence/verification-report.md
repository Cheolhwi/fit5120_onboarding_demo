# KiraSihat implementation verification

Verified on 7 August 2026 against the local `main` branch at commit `6319879` and the deployed GitHub Pages application.

## Automated application checks

- `npm test`: **108/108 checks passed**.
- The built mock bundle covers the four-screen journey, BM/English content, larger text, DOSM/NHMS source rendering, action ranking, safety warnings, weekly goal management, reminder controls, the one-off screening flow, preference reload, responsive CSS rules, and the safety-language sweep.
- No uncaught runtime error was reported during the automated journey.

## Appwrite checks

- Endpoint: `https://sgp.cloud.appwrite.io/v1`
- Project: `6a707f1300026de996cc`
- Database: `kirasihat`
- Connection check: **8/8 tables found; seed data present**.
- Drift check: live Appwrite rows match the repository seed exactly:
  - `source_registry`: 7 rows
  - `population_context`: 4 rows
  - `mortality_context`: 8 rows
  - `factor_prevalence`: 4 rows
  - `action_content`: 6 rows

## Live deployed-app checks

URL: https://cheolhwi.github.io/fit5120_onboarding_demo/

The deployed application was exercised with a real anonymous Appwrite session. The run verified:

- a minimal profile and live fixed/changeable summary;
- the 41–59 DOSM insight with source, year, denominator and caveat;
- three approved action options, matched ordering, safety notes and the urgent-help warning;
- saving the selected action to Appwrite;
- changing the weekly target from 5 to 3 and updating progress;
- reminder opt-in and opt-out;
- source and safety provenance on the saved plan;
- delete cancellation leaves the plan in place;
- delete confirmation removes the synthetic profile/goal and returns to a fresh profile.

No browser console error was observed. Appwrite emitted only its standard custom-domain recommendation warning.

## Design evidence

The following repository SVGs are uploaded directly as design evidence:

- `KiraSihat_Design_System.svg`
- `Desktop_3_Choose_one_action_1440.svg`
- `Desktop_4_My_plan_1440.svg`

Cloud Figma reference: https://www.figma.com/design/11YXa6im1NbMyuxmD9eFAc/KiraSihat-%E2%80%94-App-Design--FIT5120-TM01-?node-id=1-20&p=f&t=jC0qrVbUqpJrKmBz-0

The Figma cloud canvas required sign-in in the available browser, so the SVG evidence was used directly as requested.
