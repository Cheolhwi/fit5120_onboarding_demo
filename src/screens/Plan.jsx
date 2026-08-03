import React, { useEffect, useState } from 'react';
import { AppBar, NavBar } from '../components/common.jsx';
import { t } from '../i18n.js';
import { getActions, getActiveGoal, updateGoal, deleteMyData } from '../lib/db.js';

const MYSEJAHTERA =
  'https://mysejahtera.moh.gov.my/en/health-records-in-mysejahtera/health-screening/introduction';

/**
 * Screen 4 — features F12, F13, F14, F15, F16.
 * This is the only screen backed by rows the user owns.
 */
export default function Plan({ lang, setLang, draft, onRestart, go, reach }) {
  const S = t(lang);
  const [goal, setGoal] = useState(null);
  const [action, setAction] = useState(null);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [g, actions] = await Promise.all([getActiveGoal(), getActions(lang)]);
        if (cancelled) return;
        setGoal(g);
        setAction(actions.find((a) => a.action_key === g?.action_key) ?? null);
        setStatus('ready');
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

  const screeningRelevant =
    draft.lifestyle.includes('no_screening_3y') ||
    draft.ageBand === '41-59' ||
    draft.ageBand === '60+';

  return (
    <>
      <AppBar lang={lang} setLang={setLang} title={S.g_title} sub={S.g_sub} />

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
                  {S.g_thisWeek}
                </p>
                <h2 style={{ color: '#fff', marginTop: 6 }}>{action.title}</h2>
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
                <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
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
            {screeningRelevant && (
              <section className="card">
                <h3>{S.g_screening}</h3>
                <p className="muted">{S.g_screeningBody}</p>
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
