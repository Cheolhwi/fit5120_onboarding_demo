import React from 'react';
import { t, field } from '../i18n.js';

/** Teal header with brand, BM/EN toggle, title and optional step line. */
export function AppBar({ lang, setLang, textSize, setTextSize, step, title, sub }) {
  const S = t(lang);
  return (
    <header className="appbar">
      <div className="appbar__top">
        <div className="appbar__brand">
          <span className="appbar__mark" aria-hidden="true">✓</span>
          {S.brand}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* AC 1.2.4 — text size sits beside language; both change presentation
              only, never the content or its meaning. */}
          <div className="langtoggle" role="group" aria-label={S.textSize}>
            {[
              ['normal', 'A', S.textSizeNormal],
              ['large', 'A+', S.textSizeLarge],
            ].map(([size, glyph, label]) => (
              <button
                key={size}
                type="button"
                aria-pressed={textSize === size}
                aria-label={label}
                onClick={() => setTextSize(size)}
              >
                {glyph}
              </button>
            ))}
          </div>
          <div className="langtoggle" role="group" aria-label="Language / Bahasa">
            {['ms', 'en'].map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={lang === code}
                onClick={() => setLang(code)}
              >
                {code === 'ms' ? 'BM' : 'EN'}
              </button>
            ))}
          </div>
        </div>
      </div>
      {step && <div className="appbar__step">{step}</div>}
      <h1>{title}</h1>
      {sub && <p className="appbar__sub">{sub}</p>}
    </header>
  );
}

/** Feature F08 — visible on every screen that shows a figure. */
export function NotDiagnosisBanner({ lang }) {
  const S = t(lang);
  return (
    <div className="banner banner--amber" role="note">
      <span className="banner__icon" aria-hidden="true">!</span>
      <span>
        <strong>{S.i_notDiag}</strong>
        {S.i_noRisk}
      </span>
    </div>
  );
}

/** Feature F07 — owner, publication date, URL and caveat beside every claim. */
export function SourceChip({ lang, source, year }) {
  const S = t(lang);
  if (!source) return null;
  const caveat = field(source, 'caveat', lang);
  const published = source.publication_date
    ? new Date(source.publication_date).getFullYear()
    : null;
  return (
    <div className="sourcechip">
      <span className="sourcechip__i" aria-hidden="true">i</span>
      <span>
        <strong>{S.src_label}:</strong> {source.owner} — {source.title}
        {published ? ` (${published})` : ''}
        {year ? ` · ${S.src_year} ${year}` : ''} ·{' '}
        <a href={source.canonical_url} target="_blank" rel="noreferrer noopener">
          {source.licence}
        </a>
        {caveat && (
          <>
            <br />
            <strong>{S.caveat}</strong> {caveat}
          </>
        )}
      </span>
    </div>
  );
}

/** Horizontal bar with a text value — colour is never the only signal. */
export function Bar({ label, pct, max = 36, tone = 0 }) {
  const shades = ['#0f4c5c', '#2f7e8c', '#6fa3ae', '#a9c6cc'];
  return (
    <div>
      <div className="bar__head">
        <span>{label}</span>
        <b>{pct}%</b>
      </div>
      <div
        className="bar__track"
        role="img"
        aria-label={`${label}: ${pct} percent`}
      >
        <div
          className="bar__fill"
          style={{ width: `${Math.min(100, (pct / max) * 100)}%`, background: shades[tone % 4] }}
        />
      </div>
    </div>
  );
}

/** Bottom navigation. Screens the user has not reached yet stay disabled. */
export function NavBar({ lang, screen, go, reach }) {
  const S = t(lang);
  const items = [
    ['profile', S.nav.me],
    ['insight', S.nav.data],
    ['actions', S.nav.action],
    ['plan', S.nav.goal],
  ];
  // 'welcome' is screen 0 and deliberately has no tab: it is not a step of
  // the flow, and adding it would renumber the desktop rail's 1-4 counter.
  const order = ['welcome', 'profile', 'insight', 'actions', 'plan'];
  return (
    <nav className="nav" aria-label="Sections">
      {items.map(([key, label]) => (
        <button
          key={key}
          type="button"
          aria-current={screen === key ? 'page' : undefined}
          disabled={order.indexOf(key) > order.indexOf(reach)}
          onClick={() => go(key)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
