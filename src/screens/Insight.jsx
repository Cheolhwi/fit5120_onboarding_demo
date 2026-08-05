import React, { useEffect, useState } from 'react';
import { AppBar, NotDiagnosisBanner, SourceChip, Bar, NavBar } from '../components/common.jsx';
import { t, field } from '../i18n.js';
import { getMortalityContext, getFactorPrevalence, getSources } from '../lib/db.js';

/**
 * Screen 2 — features F04, F05, F06, F07, F08.
 * Reads only. Nothing about the user is written to the database here.
 */
export default function Insight({ lang, setLang, textSize, setTextSize, draft, publishedBand, onNext, go, reach }) {
  const S = t(lang);
  // One bundle for the app bar so a new control cannot be forgotten at a call site.
  const bar = { lang, setLang, textSize, setTextSize };
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setState({ status: 'loading' });
        const [causes, factors] = await Promise.all([
          getMortalityContext(publishedBand),
          getFactorPrevalence(),
        ]);
        const sources = await getSources([
          ...causes.map((c) => c.source_id),
          ...factors.map((f) => f.source_id),
        ]);
        if (!cancelled) setState({ status: 'ready', causes, factors, sources });
      } catch (err) {
        console.error(err);
        if (!cancelled) setState({ status: 'error' });
      }
    })();
    return () => { cancelled = true; };
  }, [publishedBand]);

  const top = state.causes?.[0];
  const year = top?.year ?? 2024;

  return (
    <>
      <AppBar
        {...bar}
        title={S.i_title}
        sub={S.i_sub(publishedBand ?? '—', year)}
      />

      <main className="screen screen--withnav">
        <NotDiagnosisBanner lang={lang} />

        {state.status === 'loading' && <p className="muted">{S.loading}</p>}
        {state.status === 'error' && <div className="error" role="alert">{S.error}</div>}

        {state.status === 'ready' && (
          <>
            {/* F04 — say out loud which band is being shown and why */}
            {draft.ageBand && publishedBand && draft.ageBand !== publishedBand && (
              <p className="muted small">{S.i_mapped(draft.ageBand, publishedBand)}</p>
            )}

            <div className="cols">
            {/* F05 — the core insight */}
            {top ? (
              <section className="card">
                <p className="muted small">{S.i_leading(publishedBand)}</p>
                <h2>{field(top, 'cause', lang)}</h2>
                <p className="stat">{S.i_deaths(top.count, top.share_pct)}</p>
                <p className="muted small" style={{ marginTop: 10 }}>
                  {field(top, 'denominator_note', lang)}
                </p>
                {/* F07 */}
                <SourceChip lang={lang} source={state.sources[top.source_id]} year={top.year} />
              </section>
            ) : (
              <div className="banner banner--amber" role="note">
                <span className="banner__icon" aria-hidden="true">!</span>
                <span>{S.i_empty}</span>
              </div>
            )}

            {/* Changeable factors — the bridge from "what kills" to "what I can do" */}
            {state.factors.length > 0 && (
              <section className="card">
                <h3>{S.i_factors}</h3>
                <p className="muted small">
                  {S.i_factorsSub(state.factors[0].scope, state.factors[0].year)}
                </p>
                <div className="bars">
                  {state.factors.map((f, i) => (
                    <Bar key={f.$id} label={field(f, 'label', lang)} pct={f.pct} tone={i} />
                  ))}
                </div>
                <div style={{ marginTop: 14 }}>
                  <SourceChip
                    lang={lang}
                    source={state.sources[state.factors[0].source_id]}
                    year={state.factors[0].year}
                  />
                </div>
              </section>
            )}
            </div>

            {/* F06 — plain-language explanation */}
            {top && (
              <section className="card card--blue">
                <h3 style={{ color: 'var(--teal)' }}>{S.i_means}</h3>
                <p>{S.i_meansBody}</p>
              </section>
            )}

            <button className="btn" type="button" onClick={onNext}>{S.i_next}</button>
          </>
        )}
      </main>

      <NavBar lang={lang} screen="insight" go={go} reach={reach} />
    </>
  );
}
