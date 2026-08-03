import React, { useEffect, useState } from 'react';
import Profile from './screens/Profile.jsx';
import Insight from './screens/Insight.jsx';
import Actions from './screens/Actions.jsx';
import Plan from './screens/Plan.jsx';
import { getPublishedBands, saveProfile, saveGoal, isMock, getConfigError } from './lib/db.js';
import { mapToPublishedBand } from './lib/bandMap.js';

const EMPTY_DRAFT = {
  ageBand: '',
  sex: '',
  state: '',
  lifestyle: [],
  consent: false,
};

const ORDER = ['profile', 'insight', 'actions', 'plan'];

export default function App() {
  const [lang, setLang] = useState('en');
  // AC 1.2.4 — presentation preference, remembered across visits. It changes
  // nothing about the content, so it is not part of the health profile and is
  // never written to the database.
  const [textSize, setTextSize] = useState(
    () => globalThis.localStorage?.getItem('kirasihat.textSize') || 'normal'
  );
  const [screen, setScreen] = useState('profile');
  const [reach, setReach] = useState('profile');       // furthest screen unlocked
  const [draft, setDraft] = useState(EMPTY_DRAFT);     // held in memory only
  const [bands, setBands] = useState([]);
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.documentElement.lang = lang === 'ms' ? 'ms' : 'en';
  }, [lang]);

  useEffect(() => {
    globalThis.localStorage?.setItem('kirasihat.textSize', textSize);
  }, [textSize]);

  useEffect(() => {
    getPublishedBands().then(setBands).catch((err) => console.error(err));
  }, []);

  const publishedBand = draft.ageBand ? mapToPublishedBand(draft.ageBand, bands) : null;

  const advance = (to) => {
    setScreen(to);
    if (ORDER.indexOf(to) > ORDER.indexOf(reach)) setReach(to);
    window.scrollTo({ top: 0 });
  };

  const go = (to) => {
    setScreen(to);
    window.scrollTo({ top: 0 });
  };

  /**
   * The first and only write of the whole flow. Up to this point the app has
   * created no session and stored nothing about the user.
   */
  const saveGoalAndPlan = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveProfile({
        ageBand: draft.ageBand,
        sex: draft.sex,
        state: draft.state,
        screeningBand: draft.lifestyle.includes('no_screening_3y') ? 'over_3y' : 'unknown',
        lifestyle: draft.lifestyle,
        language: lang,
      });
      await saveGoal({ actionKey: selected, target: 5, reminder: false });
      advance('plan');
    } catch (err) {
      console.error(err);
      alert('Could not save. Check the Appwrite connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const restart = () => {
    setDraft(EMPTY_DRAFT);
    setSelected('');
    setReach('profile');
    setScreen('profile');
  };

  const shared = { lang, setLang, textSize, setTextSize, go, reach };
  const appClass = `app${textSize === 'large' ? ' app--lg' : ''}`;

  // A misconfigured build used to produce a silent blank page. Say what is wrong.
  const configError = getConfigError();
  if (configError) {
    return (
      <div className={appClass}>
        <header className="appbar">
          <h1>Configuration problem</h1>
        </header>
        <main className="screen">
          <div className="error" role="alert">{configError}</div>
          <p className="muted">
            The interface cannot start without an Appwrite endpoint and project ID.
            Nothing is wrong with your device — this is a deployment setting.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className={appClass}>
      {isMock() && (
        <div className="mockflag">
          MOCK MODE — reading data/seed-data.json, no Appwrite connection
        </div>
      )}

      {screen === 'profile' && (
        <Profile
          {...shared}
          draft={draft}
          setDraft={setDraft}
          publishedBand={publishedBand}
          onContinue={() => advance('insight')}
        />
      )}

      {screen === 'insight' && (
        <Insight
          {...shared}
          draft={draft}
          publishedBand={publishedBand}
          onNext={() => advance('actions')}
        />
      )}

      {screen === 'actions' && (
        <Actions
          {...shared}
          draft={draft}
          selected={selected}
          setSelected={setSelected}
          onSave={saveGoalAndPlan}
        />
      )}

      {screen === 'plan' && (
        <Plan {...shared} draft={draft} onRestart={restart} />
      )}
    </div>
  );
}
