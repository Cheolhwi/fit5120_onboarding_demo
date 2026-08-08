# KiraSihat automated testing completion evidence

Verified on **7 August 2026** against local `main` commit `6319879`.

## Command and result

Command: `npm test`

The test workflow built the mock production bundle successfully (51 modules transformed) and then ran the complete smoke-test journey.

Final result: **108/108 checks passed**. All MVP features **F01-F17** were verified against the built bundle, with **0 uncaught runtime errors**.

## Coverage recorded in the passing run

- Profile validation: missing age band, missing consent, and blocked invalid continuation.
- Data minimisation: no exact age/state field and purpose text for optional input.
- Live profile summary: fixed/changeable grouping and edit reflection.
- Accessibility preferences: BM/English language, `html lang`, larger text and refresh persistence.
- Official insight: DOSM band, leading cause, year, figures, source, licence and caveat.
- Safety language: population context is not presented as diagnosis or personal risk.
- Action selection: 2-3 approved actions, matching order, empty-selection blocking and unsupported-content handling.
- Activity guidance: reviewed WHO 150-300 minutes range and provenance.
- Safety: a safety note on every action and an always-visible urgent-help route.
- Goal management: correct selected action, target 1-7, progress increase/decrease, completion and stop.
- One-off screening: booked/not-booked flow with no weekly target or streak pressure.
- Reminder: user-controlled opt-in/opt-out behaviour.
- Saved plan: retained source link, caveat and safety note.
- Deletion: delete control reachable; live verification separately covered cancel and confirm outcomes.
- Responsive presentation: mobile defaults and desktop breakpoint rules.
- Whole-session sweep: no forbidden diagnosis/personal-risk wording and no runtime error.

## Additional live checks

The deployed site at https://cheolhwi.github.io/fit5120_onboarding_demo/ was also exercised with a real anonymous Appwrite session. It confirmed profile-to-insight navigation, action save, goal update, reminder opt-in/opt-out, source/safety display, delete cancellation and confirmed deletion.

Related backend verification: `backend-appwrite-evidence.md`.

