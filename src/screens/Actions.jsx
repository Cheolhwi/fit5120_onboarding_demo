import React, { useEffect, useState } from 'react';
import { AppBar, SourceChip, NavBar } from '../components/common.jsx';
import { t } from '../i18n.js';
import { getActions, getSources, topicsForFlags, FLAGS_WITHOUT_ACTION } from '../lib/db.js';

/**
 * Screen 3 — features F09, F10, F11.
 * Single-select. Every option carries source, reason, first step and a
 * safety note; the urgent-symptom route is always visible, never behind a tap.
 */
export default function Actions({ lang, setLang, textSize, setTextSize, draft, selected, setSelected, setSelectedTopic, onSave, go, reach }) {
  const S = t(lang);
  // One bundle for the app bar so a new control cannot be forgotten at a call site.
  const bar = { lang, setLang, textSize, setTextSize };
  const [state, setState] = useState({ status: 'loading' });
  const [touched, setTouched] = useState(false);

  const flags = draft?.lifestyle ?? [];
  const topics = topicsForFlags(flags);
  const unanswered = flags.filter((f) => FLAGS_WITHOUT_ACTION.includes(f));
  const topicKey = topics.join(',');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setState({ status: 'loading' });
        const actions = await getActions(lang, topics);
        const sources = await getSources(actions.map((a) => a.source_id));
        if (!cancelled) setState({ status: 'ready', actions, sources });
      } catch (err) {
        console.error(err);
        if (!cancelled) setState({ status: 'error' });
      }
    })();
    return () => { cancelled = true; };
    // topicKey rather than the array so the effect does not refire every render
  }, [lang, topicKey]);

  const save = () => {
    if (!selected) { setTouched(true); return; }
    onSave();
  };

  return (
    <>
      <AppBar {...bar} title={S.a_title} sub={S.a_sub} />

      <main className="screen screen--withnav">
        {state.status === 'loading' && <p className="muted">{S.loading}</p>}
        {state.status === 'error' && <div className="error" role="alert">{S.error}</div>}

        {state.status === 'ready' && (
          <>
            {/* Says why the order is what it is — the checklist is visibly used */}
            <p className="muted small">{S.a_why(topics.length)}</p>

            {/* A ticked box with no reviewed content is stated, not papered over */}
            {unanswered.length > 0 && (
              <div className="banner banner--amber" role="note">
                <span className="banner__icon" aria-hidden="true">!</span>
                <span>{S.a_noContent}</span>
              </div>
            )}

            <fieldset>
              <legend className="sr-only">{S.a_title}</legend>
              <div className="actionlist">
                {state.actions.map((a) => (
                  <div
                    key={a.$id}
                    className="card action"
                    data-selected={selected === a.action_key}
                  >
                    <label className="action__body">
                      <input
                        type="radio"
                        name="action"
                        value={a.action_key}
                        checked={selected === a.action_key}
                        onChange={() => {
                          setSelected(a.action_key);
                          // The topic decides whether the plan screen is a
                          // weekly habit or a single task — see isOneOff.
                          setSelectedTopic(a.topic);
                          setTouched(false);
                        }}
                      />
                      <span>
                        <span className="action__title">{a.title}</span>
                        {a.matched && (
                          <span
                            className="chip chip--effort"
                            style={{ marginBottom: 6 }}
                          >
                            {S.a_matched}
                          </span>
                        )}
                        {/* F10 — the reason names the guidance behind the action */}
                        <span className="action__reason">{a.reason}</span>
                        <span className="action__step">
                          <b>{S.a_firstStep}</b> {a.first_step}
                        </span>
                        <span className="chip chip--effort">{S.a_effort[a.effort]}</span>
                        <span style={{ display: 'block', marginTop: 12 }}>
                          <SourceChip lang={lang} source={state.sources[a.source_id]} />
                        </span>
                      </span>
                    </label>
                    {/* F11 — safety note on every single action */}
                    <p className="action__safety">
                      <b>{S.a_safety}</b> {a.safety_note}
                    </p>
                  </div>
                ))}
              </div>
            </fieldset>

            {/* F11 — urgent symptoms are routed to care, not to a weekly goal */}
            <div className="banner banner--red" role="note">
              <span className="banner__icon" aria-hidden="true">!</span>
              <span>
                <strong>{S.a_urgentTitle}</strong>
                {S.a_urgentBody}
              </span>
            </div>

            {touched && !selected && (
              <div className="error" role="alert">{S.a_pick}</div>
            )}

            <button className="btn" type="button" onClick={save}>{S.a_save}</button>
          </>
        )}
      </main>

      <NavBar lang={lang} screen="actions" go={go} reach={reach} />
    </>
  );
}
