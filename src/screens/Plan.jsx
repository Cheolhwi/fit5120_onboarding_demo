import React, { useEffect, useState } from 'react';
import { AppBar, NavBar, SourceChip } from '../components/common.jsx';
import { t } from '../i18n.js';
import { getActions, getActiveGoal, getSources, updateGoal, deleteMyData, isOneOff } from '../lib/db.js';

// AC 2.2.2 — the user sets the weekly target. 5 is only a default because the
// walk_30 action quotes WHO's 150 minutes as 5 x 30; it is not a rule, and a
// lower number must never be presented as a failure (F15).
const TARGETS = [1, 2, 3, 4, 5, 6, 7];

const MYSEJAHTERA =
  'https://mysejahtera.moh.gov.my/en/health-records-in-mysejahtera/health-screening/introduction';

// The same MOH service as R4, listed in the government's own service directory.
// Kept as a second route because a user who cannot get MySejahtera working still
// has an official page to reach the service from. The facts quoted beside it
// (free of charge, phone/email and MyKad required) are stated on this page.
const MYGOV_BOOKING =
  'https://www.malaysia.gov.my/en/digital-services/application-for-booking-an-appointment-for-health-check';

/**
 * Screen 4 — features F12, F13, F14, F15, F16.
 * This is the only screen backed by rows the user owns.
 */
export default function Plan({ lang, setLang, textSize, setTextSize, draft, onRestart, go, reach }) {
  const S = t(lang);
  // One bundle for the app bar so a new control cannot be forgotten at a call site.
  const bar = { lang, setLang, textSize, setTextSize };
  const [goal, setGoal] = useState(null);
  const [action, setAction] = useState(null);
  const [source, setSource] = useState(null);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [g, actions] = await Promise.all([getActiveGoal(), getActions(lang)]);
        if (cancelled) return;
        const chosen = actions.find((a) => a.action_key === g?.action_key) ?? null;
        setGoal(g);
        setAction(chosen);
        // AC 2.2.4 — the saved plan must carry the same provenance and safety
        // note the user saw when choosing. Losing them on save would mean the
        // screen they return to every week is the one with no source on it.
        if (chosen) {
          const sources = await getSources([chosen.source_id]);
          if (!cancelled) setSource(sources[chosen.source_id] ?? null);
        }
        if (!cancelled) setStatus('ready');
      } catch (err) {
        console.error(err);
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [lang]);

  // F14 — progress is a plain counter. No streak, no penalty for a missed day.
  const toggleDay = async (index) => {
    if (!goal) return;
    const next = index < goal.progress ? index : index + 1;
    const updated = await updateGoal(goal.$id, { progress: next });
    setGoal({ ...goal, ...updated, progress: next });
  };

  const stopGoal = async () => {
    if (!goal) return;
    await updateGoal(goal.$id, { status: 'stopped' });
    setGoal(null);
    setMessage('');
  };

  // AC 2.2.2 — a goal can be completed, not only stopped. Completing is always
  // available; it does not require hitting the target, because a forced target
  // would be the streak pressure F15 exists to avoid.
  const completeGoal = async () => {
    if (!goal) return;
    await updateGoal(goal.$id, { status: 'completed' });
    setGoal(null);
    setMessage(S.g_completed);
  };

  // AC 2.2.2 — editing the target never destroys logged progress; if the new
  // target is lower than what is already done, progress is clamped, not reset.
  const changeTarget = async (target) => {
    if (!goal) return;
    const progress = Math.min(goal.progress, target);
    await updateGoal(goal.$id, { target, progress });
    setGoal({ ...goal, target, progress });
  };

  const toggleReminder = async (on) => {
    if (!goal) return;
    await updateGoal(goal.$id, { reminder_opt_in: on });
    setGoal({ ...goal, reminder_opt_in: on });
  };

  // F16 — irreversible, confirmed, and it really deletes.
  const removeData = async () => {
    if (!window.confirm(S.g_deleteConfirm)) return;
    await deleteMyData();
    setGoal(null);
    setMessage(S.g_deleted);
    onRestart();
  };

  // A booking is done or not done; a habit is repeated. The plan screen has to
  // render these differently or it asks the user to tick six more boxes for an
  // appointment they have already made.
  const oneOff = isOneOff(action?.topic);

  // The one-off equivalent of toggleDay. Still reversible — a user who ticks it
  // by mistake must be able to untick it without stopping the whole task.
  const markBooked = async (done) => {
    if (!goal) return;
    const progress = done ? 1 : 0;
    await updateGoal(goal.$id, { progress });
    setGoal({ ...goal, progress });
  };

  // MySejahtera's published target profile [R4]: "Aged 40 years and above ...
  // Do not undergo any health screening in the last 3 years". Both are shown as
  // separate criteria, so either one qualifies — but we say which one matched
  // rather than leaving the user to guess.
  const byAge = draft.ageBand === '41-59' || draft.ageBand === '60+';
  const byGap = draft.lifestyle.includes('no_screening_3y');
  const screeningRelevant = byAge || byGap;
  const screeningWhy = byAge && byGap ? 'both' : byAge ? 'age' : 'screening';

  return (
    <>
      <AppBar {...bar} title={S.g_title} sub={S.g_sub} />

      <main className="screen screen--withnav">
        {status === 'loading' && <p className="muted">{S.loading}</p>}
        {status === 'error' && <div className="error" role="alert">{S.error}</div>}
        {message && <div className="banner banner--amber" role="status">{message}</div>}

        {status === 'ready' && (
          <>
            {/* F14 — the weekly goal */}
            {goal && action ? (
              <section className="card card--teal">
                <p className="small" style={{ color: '#9ec9ce', letterSpacing: '.08em', margin: 0 }}>
                  {oneOff ? S.g_bookTitle : S.g_thisWeek}
                </p>
                <h2 style={{ color: '#fff', marginTop: 6 }}>{action.title}</h2>
                {!oneOff && (
                  <>
                <p style={{ color: '#bfdde0' }}>{S.g_target(goal.progress, goal.target)}</p>
                <div className="goal__dots">
                  {Array.from({ length: goal.target }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      className="dot"
                      aria-pressed={i < goal.progress}
                      aria-label={`Day ${i + 1}`}
                      onClick={() => toggleDay(i)}
                    >
                      {i < goal.progress ? '✓' : '+'}
                    </button>
                  ))}
                </div>
                  </>
                )}
                {oneOff ? (
                  <>
                    {/* A single task: booked or not. No day-dots, no target. */}
                    <p style={{ color: '#bfdde0' }}>{S.g_bookSub}</p>

                    <h3 className="book__h">{S.g_bookHow}</h3>
                    <ol className="book__steps">
                      <li>{S.g_bookStep1}</li>
                      <li>{S.g_bookStep2}</li>
                      <li>{S.g_bookStep3}</li>
                    </ol>

                    <h3 className="book__h">{S.g_bookNeed}</h3>
                    <ul className="book__steps">
                      <li>{S.g_bookNeed1}</li>
                      <li>{S.g_bookNeed2}</li>
                    </ul>
                    <p className="small" style={{ color: '#9ec9ce' }}>{S.g_bookFree}</p>

                    <a className="btn btn--book" href={MYSEJAHTERA}
                       target="_blank" rel="noreferrer noopener">
                      {S.g_openLink}
                    </a>
                    <a className="btn btn--book btn--book2" href={MYGOV_BOOKING}
                       target="_blank" rel="noreferrer noopener">
                      {S.g_bookGov}
                      <span className="book__sub">{S.g_bookGovSub}</span>
                    </a>

                    <label className="book__done">
                      <input
                        type="checkbox"
                        checked={goal.progress >= 1}
                        onChange={(e) => markBooked(e.target.checked)}
                      />
                      <span>{goal.progress >= 1 ? S.g_bookedYes : S.g_booked}</span>
                    </label>
                    {goal.progress < 1 && (
                      <p className="small" style={{ color: '#9ec9ce', marginTop: 8 }}>
                        {S.g_bookNoPressure}
                      </p>
                    )}
                  </>
                ) : (
                <>
                {/* AC 2.2.2 — the weekly target is the user's to set */}
                <div className="targetrow">
                  <span className="targetrow__label">{S.g_targetLabel}</span>
                  <div className="targetrow__opts" role="group" aria-label={S.g_targetLabel}>
                    {TARGETS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        className="targetopt"
                        aria-pressed={goal.target === n}
                        onClick={() => changeTarget(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="small" style={{ color: '#bfdde0', marginTop: 8 }}>
                  {S.g_targetHelp(goal.target)}
                </p>
                <p className="small" style={{ color: '#9ec9ce', marginTop: 4 }}>
                  {S.g_targetGuide}
                </p>
                </>
                )}

                {/* AC 2.2.4 — safety note travels with the saved plan */}
                <p className="action__safety action__safety--onteal">
                  <b>{S.g_safety}</b> {action.safety_note}
                </p>

                {/* AC 2.2.4 — and so does the source */}
                <div className="sourcechip--onteal">
                  <SourceChip lang={lang} source={source} />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                  <button className="btn btn--sm" type="button" onClick={completeGoal}>
                    {S.g_complete}
                  </button>
                  <button className="btn btn--sm btn--ghost" style={{ color: '#fff', borderColor: '#4e7c88' }} type="button" onClick={() => go('actions')}>
                    {S.g_edit}
                  </button>
                  <button className="btn btn--sm btn--ghost" style={{ color: '#fff', borderColor: '#4e7c88' }} type="button" onClick={stopGoal}>
                    {S.g_stop}
                  </button>
                </div>
              </section>
            ) : (
              <section className="card">
                <p>{S.g_none}</p>
                <button className="btn btn--sm btn--ghost" type="button" onClick={() => go('actions')}>
                  {S.g_startOver}
                </button>
              </section>
            )}

            {/* F12 — screening prompt with the trusted link */}
            {screeningRelevant && !oneOff && (
              <section className="card">
                <h3>{S.g_screening}</h3>
                <p className="muted">{S.g_screeningBody}</p>
                <p className="small" style={{ color: 'var(--teal)', fontWeight: 600 }}>
                  {S.g_screeningWhy[screeningWhy]}
                </p>
                <a
                  className="btn btn--teal"
                  href={MYSEJAHTERA}
                  target="_blank"
                  rel="noreferrer noopener"
                  style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }}
                >
                  {S.g_openLink}
                </a>
                <p className="muted small" style={{ marginTop: 8 }}>{S.g_officialLink}</p>
              </section>
            )}

            {/* F13 — questions to ask */}
            <section className="card card--green">
              <h3 style={{ color: '#2f6b33' }}>{S.g_questions}</h3>
              <ul className="qlist">
                <li>{S.g_q1}</li>
                <li>{S.g_q2}</li>
                <li>{S.g_q3}</li>
              </ul>
            </section>

            {/* F15 + F16 */}
            <section className="card">
              <div className="switchrow">
                <div>
                  <h3 style={{ marginBottom: 2 }}>{S.g_reminders}</h3>
                  <p className="muted small">{S.g_remindersBody}</p>
                </div>
                <label className="switch">
                  <span className="sr-only">{S.g_reminders}</span>
                  <input
                    type="checkbox"
                    checked={!!goal?.reminder_opt_in}
                    disabled={!goal}
                    onChange={(e) => toggleReminder(e.target.checked)}
                  />
                </label>
              </div>
              <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '14px 0' }} />
              <button className="rowlink" type="button" onClick={removeData}>
                {S.g_delete}
                <span aria-hidden="true">›</span>
              </button>
            </section>
          </>
        )}
      </main>

      <NavBar lang={lang} screen="plan" go={go} reach={reach} />
    </>
  );
}
