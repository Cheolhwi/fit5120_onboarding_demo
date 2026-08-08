import React, { useEffect, useRef, useState } from 'react';
import { t } from '../i18n.js';
import { getMortalityContext, getFactorPrevalence, getSources } from '../lib/db.js';
import { SourceChip, NavBar } from '../components/common.jsx';

/**
 * Screen 0 — the welcome screen.
 *
 * The motion here is driven by real figures rather than decoration: the counter
 * counts to the DOSM total, the bars grow to the NHMS percentages. Nothing
 * animates that is not a number we can source.
 *
 * Every effect is gated on prefers-reduced-motion. When motion is reduced the
 * final state is rendered immediately — the same content, just without the
 * transition. That matters more than usual here: the audience is 41–59, and a
 * page that moves while you are trying to read it is a barrier, not a feature.
 */

const prefersReducedMotion = () =>
  globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

/** Count from 0 to `value` once the element scrolls into view. */
function useCountUp(value, ready) {
  const [shown, setShown] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (!ready || !value) return undefined;
    const node = ref.current;
    // No motion, no observer support, or nothing to observe: show the real
    // number straight away. The figure is the point; the animation is not.
    if (!node || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setShown(value);
      return undefined;
    }

    let frame;
    let started = false;
    const run = () => {
      const start = performance.now();
      const DURATION = 1100;
      const tick = (now) => {
        const p = Math.min(1, (now - start) / DURATION);
        // ease-out cubic: fast first, settles on the exact figure
        setShown(Math.round(value * (1 - (1 - p) ** 3)));
        if (p < 1) frame = requestAnimationFrame(tick);
        else setShown(value);
      };
      frame = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started) { started = true; run(); }
    }, { threshold: 0.4 });
    io.observe(node);
    return () => { io.disconnect(); cancelAnimationFrame(frame); };
  }, [value, ready]);

  return [shown, ref];
}

/** Add a class once the element has been scrolled into view, for CSS entrances. */
function useReveal() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return undefined;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { setSeen(true); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return [ref, seen];
}

export default function Welcome({ lang, setLang, textSize, setTextSize, onStart, go, reach }) {
  const S = t(lang);
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 'all' is a published DOSM band, same table and same source as every
        // other figure in the app — not a separate marketing dataset.
        const [causes, factors] = await Promise.all([
          getMortalityContext('all'),
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
  }, []);

  const causes = state.causes ?? [];
  const factors = state.factors ?? [];
  const total = causes.reduce((sum, c) => sum + (c.count ?? 0), 0);
  const [counted, counterRef] = useCountUp(total, state.status === 'ready');
  const [causesRef, causesSeen] = useReveal();
  const [factorsRef, factorsSeen] = useReveal();
  const [howRef, howSeen] = useReveal();

  const maxCount = Math.max(1, ...causes.map((c) => c.count ?? 0));

  return (
    <>
      <section className="hero">
        <div className="hero__glow" aria-hidden="true" />
        <div className="hero__top">
          <div className="appbar__brand">
            <span className="appbar__mark" aria-hidden="true">✓</span>
            {S.brand}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="langtoggle" role="group" aria-label={S.textSize}>
              {[['normal', 'A', S.textSizeNormal], ['large', 'A+', S.textSizeLarge]].map(
                ([size, glyph, label]) => (
                  <button key={size} type="button" aria-pressed={textSize === size}
                    aria-label={label} onClick={() => setTextSize(size)}>{glyph}</button>
                ))}
            </div>
            <div className="langtoggle" role="group" aria-label="Language / Bahasa">
              {['ms', 'en'].map((code) => (
                <button key={code} type="button" aria-pressed={lang === code}
                  onClick={() => setLang(code)}>{code === 'ms' ? 'BM' : 'EN'}</button>
              ))}
            </div>
          </div>
        </div>

        <p className="hero__kicker anim anim--1">{S.w_kicker}</p>
        <h1 className="hero__title anim anim--2">{S.w_title}</h1>
        <p className="hero__lead anim anim--3">{S.w_lead}</p>

        <div className="hero__cta anim anim--4">
          <button className="btn" type="button" onClick={onStart}>{S.w_start}</button>
          <a className="btn btn--onteal" href="#figures">{S.w_seeData}</a>
        </div>

        <p className="hero__scroll anim anim--5" aria-hidden="true">{S.w_scroll}</p>
      </section>

      <main className="screen screen--withnav" id="figures">
        {state.status === 'loading' && <p className="muted">{S.loading}</p>}
        {state.status === 'error' && <div className="error" role="alert">{S.error}</div>}

        {state.status === 'ready' && (
          <>
            {/* National picture — DOSM, same table the insight screen reads */}
            <section className="card" ref={causesRef}>
              <h2>{S.w_nationalTitle}</h2>
              <p className="counter" ref={counterRef}>
                <b>{counted.toLocaleString('en-MY')}</b> {S.w_deathsUnit}
              </p>
              <p className="muted small">{S.w_nationalLead(total)}</p>

              <div className={`causes${causesSeen ? ' causes--in' : ''}`}>
                {causes.map((c, i) => (
                  <div className="cause" key={c.$id} style={{ '--i': i }}>
                    <div className="cause__head">
                      <span>{c[`cause_${lang === 'ms' ? 'ms' : 'en'}`] ?? c.cause_en}</span>
                      <b>{c.count.toLocaleString('en-MY')}</b>
                    </div>
                    <div className="cause__track">
                      <span
                        className="cause__fill"
                        style={{ '--w': `${Math.round((c.count / maxCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {causes[0] && (
                <div style={{ marginTop: 14 }}>
                  <SourceChip lang={lang} source={state.sources[causes[0].source_id]}
                    year={causes[0].year} />
                </div>
              )}
            </section>

            {/* Changeable factors — NHMS. Framed as population, never as "you" */}
            <section className="card" ref={factorsRef}>
              <h2>{S.w_factorsTitle}</h2>
              <p className="muted small">{S.w_factorsLead}</p>
              <div className={`causes${factorsSeen ? ' causes--in' : ''}`}>
                {factors.map((f, i) => (
                  <div className="cause" key={f.$id} style={{ '--i': i }}>
                    <div className="cause__head">
                      <span>{f[`label_${lang === 'ms' ? 'ms' : 'en'}`] ?? f.label_en}</span>
                      <b>{f.pct}%</b>
                    </div>
                    <div className="cause__track">
                      <span className="cause__fill cause__fill--green"
                        style={{ '--w': `${f.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {factors[0] && (
                <div style={{ marginTop: 14 }}>
                  <SourceChip lang={lang} source={state.sources[factors[0].source_id]}
                    year={factors[0].year} />
                </div>
              )}
            </section>

            {/* How it works */}
            <section className="card card--blue" ref={howRef}>
              <h2 style={{ color: 'var(--teal)' }}>{S.w_howTitle}</h2>
              <ol className={`steps${howSeen ? ' steps--in' : ''}`}>
                {[
                  [S.w_step1, S.w_step1b], [S.w_step2, S.w_step2b],
                  [S.w_step3, S.w_step3b], [S.w_step4, S.w_step4b],
                ].map(([title, body], i) => (
                  <li key={title} style={{ '--i': i }}>
                    <b>{title}</b>
                    <span className="muted small">{body}</span>
                  </li>
                ))}
              </ol>
            </section>

            {/* F08 — the boundary is stated before the user commits, not after */}
            <section className="banner banner--amber" role="note">
              <span className="banner__icon" aria-hidden="true">!</span>
              <span>
                <strong>{S.w_promiseTitle}</strong>
                {S.w_promise1}<br />{S.w_promise2}<br />{S.w_promise3}
              </span>
            </section>

            <button className="btn" type="button" onClick={onStart}>{S.w_start}</button>
          </>
        )}
      </main>

      <NavBar lang={lang} screen="welcome" go={go} reach={reach} />
    </>
  );
}
