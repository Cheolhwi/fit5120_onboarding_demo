import React, { useState } from 'react';
import { AppBar, NavBar } from '../components/common.jsx';
import { t } from '../i18n.js';
import { USER_BANDS } from '../lib/bandMap.js';

// AC 1.1.1 — every input has to be justifiable. "State" was removed: it was
// collected but never read, because DOSM's cause-of-death release we use is
// national, not by state. Asking for it contradicted the promise on this very
// screen. If state-level data is licensed later, re-add the field then.

const FLAGS = ['sedentary', 'sugary_drinks', 'no_screening_3y', 'smoker'];

/**
 * Screen 1 — features F01, F02, F03.
 * Nothing here is written to the database. The profile is held in memory
 * until the user saves a goal on screen 4.
 */
export default function Profile({ lang, setLang, textSize, setTextSize, draft, setDraft, onContinue, publishedBand, go, reach }) {
  const S = t(lang);
  // One bundle for the app bar so a new control cannot be forgotten at a call site.
  const bar = { lang, setLang, textSize, setTextSize };
  const [errors, setErrors] = useState([]);

  const set = (patch) => setDraft({ ...draft, ...patch });

  const toggleFlag = (flag) => {
    const has = draft.lifestyle.includes(flag);
    set({
      lifestyle: has ? draft.lifestyle.filter((f) => f !== flag) : [...draft.lifestyle, flag],
    });
  };

  // F03 — validation gate. No insight is produced until this passes.
  const submit = (e) => {
    e.preventDefault();
    const errs = [];
    if (!draft.ageBand) errs.push(S.p_err_band);
    if (!draft.consent) errs.push(S.p_err_consent);
    setErrors(errs);
    if (errs.length === 0) onContinue();
  };

  return (
    <>
      <AppBar {...bar} step={S.p_step} title={S.p_title} sub={S.p_sub} />

      <form className="screen screen--withnav" onSubmit={submit} noValidate>
        {errors.length > 0 && (
          <div className="error" role="alert">
            {errors.map((msg) => (
              <div key={msg}>{msg}</div>
            ))}
          </div>
        )}

        {/* F01 — age band */}
        <fieldset>
          <div className="labelrow">
            <legend>{S.p_ageBand}</legend>
            <span className="tag tag--req">{S.required}</span>
          </div>
          <div className="bandgrid">
            {USER_BANDS.map((band) => (
              <button
                key={band}
                type="button"
                className="band"
                aria-pressed={draft.ageBand === band}
                onClick={() => set({ ageBand: band })}
              >
                {band}
              </button>
            ))}
          </div>
          {/* F04 — say whose bands these are, and disclose any re-bucketing.
              The bands offered are DOSM's own, so the second line normally
              stays hidden; it appears only if the published bands change. */}
          <p className="muted small" style={{ marginTop: 10 }}>{S.p_official}</p>
          {draft.ageBand && publishedBand && draft.ageBand !== publishedBand && (
            <p className="muted small">
              {S.p_closest} <b>{publishedBand}</b>
            </p>
          )}
        </fieldset>

        {/* Optional demographics — never required */}
        <fieldset>
          <div className="labelrow">
            <legend>{S.p_sexState}</legend>
            <span className="tag tag--opt">{S.optional}</span>
          </div>
          <p className="muted small" style={{ marginTop: 0, marginBottom: 10 }}>{S.p_sexWhy}</p>
          <div className="selectrow">
            <label className="field">
              <span>{S.p_sex}</span>
              <select value={draft.sex} onChange={(e) => set({ sex: e.target.value })}>
                <option value="">{S.p_notSaid}</option>
                <option value="male">{S.p_male}</option>
                <option value="female">{S.p_female}</option>
              </select>
            </label>
          </div>
        </fieldset>

        {/* F02 — lifestyle checklist, allow-list only */}
        <fieldset>
          <div className="labelrow">
            <legend>{S.p_lifestyle}</legend>
            <span className="tag tag--opt">{S.optional}</span>
          </div>
          <p className="muted small" style={{ marginTop: 0, marginBottom: 10 }}>{S.p_lifestyleWhy}</p>
          <div className="checklist">
            {FLAGS.map((flag) => (
              <label key={flag} className="check">
                <input
                  type="checkbox"
                  checked={draft.lifestyle.includes(flag)}
                  onChange={() => toggleFlag(flag)}
                />
                <span>{S[`p_flag_${flag}`]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* AC 1.1.3 — summary that separates fixed from changeable, and stays
            editable because every field above remains live. "Changeable" means
            only that NHMS 2023 [R2] measures these behaviours across Malaysian
            adults; it makes no claim about this person's own risk. */}
        <section className="card" aria-live="polite">
          <h3>{S.p_summary}</h3>
          <div className="summary">
            <div className="summary__block summary__block--fixed">
              <h4>{S.p_fixedTitle}</h4>
              <p className="muted small">{S.p_fixedBody}</p>
              <ul>
                <li>
                  {S.p_ageBand}: <b>{draft.ageBand || S.p_notSet}</b>
                </li>
                <li>
                  {S.p_sex}:{' '}
                  <b>
                    {draft.sex === 'male'
                      ? S.p_male
                      : draft.sex === 'female'
                        ? S.p_female
                        : S.p_notSaid}
                  </b>
                </li>
              </ul>
            </div>

            <div className="summary__block summary__block--change">
              <h4>{S.p_changeTitle}</h4>
              <p className="muted small">{S.p_changeBody}</p>
              {draft.lifestyle.length === 0 ? (
                <p className="muted small">{S.p_changeNone}</p>
              ) : (
                <ul>
                  {draft.lifestyle.map((flag) => (
                    <li key={flag}>{S[`p_flag_${flag}`]}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <p className="muted small" style={{ marginTop: 10 }}>{S.p_editHint}</p>
        </section>

        {/* F03 — explicit, versioned consent */}
        <div className="banner banner--amber">
          <label className="consent">
            <input
              type="checkbox"
              checked={draft.consent}
              onChange={(e) => set({ consent: e.target.checked })}
            />
            <span>{S.p_consent}</span>
          </label>
        </div>

        <button className="btn" type="submit">{S.continue}</button>
      </form>

      <NavBar lang={lang} screen="profile" go={go} reach={reach} />
    </>
  );
}
