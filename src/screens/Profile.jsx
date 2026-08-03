import React, { useState } from 'react';
import { AppBar } from '../components/common.jsx';
import { t } from '../i18n.js';
import { USER_BANDS } from '../lib/bandMap.js';

const STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang',
  'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor',
  'Terengganu', 'W.P. Kuala Lumpur', 'W.P. Labuan', 'W.P. Putrajaya',
];

const FLAGS = ['sedentary', 'sugary_drinks', 'no_screening_3y', 'smoker'];

/**
 * Screen 1 — features F01, F02, F03.
 * Nothing here is written to the database. The profile is held in memory
 * until the user saves a goal on screen 4.
 */
export default function Profile({ lang, setLang, draft, setDraft, onContinue, publishedBand }) {
  const S = t(lang);
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
      <AppBar lang={lang} setLang={setLang} step={S.p_step} title={S.p_title} sub={S.p_sub} />

      <form className="screen" onSubmit={submit} noValidate>
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
          <div className="selectrow">
            <label className="field">
              <span>{S.p_sex}</span>
              <select value={draft.sex} onChange={(e) => set({ sex: e.target.value })}>
                <option value="">{S.p_notSaid}</option>
                <option value="male">{S.p_male}</option>
                <option value="female">{S.p_female}</option>
              </select>
            </label>
            <label className="field">
              <span>{S.p_state}</span>
              <select value={draft.state} onChange={(e) => set({ state: e.target.value })}>
                <option value="">{S.p_notSaid}</option>
                {STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
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
    </>
  );
}
