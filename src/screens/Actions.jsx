import React, { useEffect, useState } from 'react';
import { AppBar, SourceChip, NavBar } from '../components/common.jsx';
import { t } from '../i18n.js';
import { getActions, getSources } from '../lib/db.js';

/**
 * Screen 3 — features F09, F10, F11.
 * Single-select. Every option carries source, reason, first step and a
 * safety note; the urgent-symptom route is always visible, never behind a tap.
 */
export default function Actions({ lang, setLang, selected, setSelected, onSave, go, reach }) {
  const S = t(lang);
  const [state, setState] = useState({ status: 'loading' });
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setState({ status: 'loading' });
        const actions = await getActions(lang);
        const sources = await getSources(actions.map((a) => a.source_id));
        if (!cancelled) setState({ status: 'ready', actions, sources });
      } catch (err) {
        console.error(err);
        if (!cancelled) setState({ status: 'error' });
      }
    })();
    return () => { cancelled = true; };
  }, [lang]);

  const save = () => {
    if (!selected) { setTouched(true); return; }
    onSave();
  };

  return (
    <>
      <AppBar lang={lang} setLang={setLang} title={S.a_title} sub={S.a_sub} />

      <main className="screen screen--withnav">
        {state.status === 'loading' && <p className="muted">{S.loading}</p>}
        {state.status === 'error' && <div className="error" role="alert">{S.error}</div>}

        {state.status === 'ready' && (
          <>
            <fieldset>
              <legend className="sr-only">{S.a_title}</legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                        onChange={() => { setSelected(a.action_key); setTouched(false); }}
                      />
                      <span>
                        <span className="action__title">{a.title}</span>
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
