import React, { useEffect, useState } from 'react';
import Welcome from './screens/Welcome.jsx';
import Profile from './screens/Profile.jsx';
import Insight from './screens/Insight.jsx';
import Actions from './screens/Actions.jsx';
import Plan from './screens/Plan.jsx';
import { getPublishedBands, saveProfile, saveGoal, isMock, getConfigError, isOneOff } from './lib/db.js';
import { mapToPublishedBand } from './lib/bandMap.js';
import { LANGS } from './i18n.js';

const EMPTY_DRAFT = {
  ageBand: '',
  sex: '',
  lifestyle: [],
  consent: false,
};

const ORDER = ['welcome', 'profile', 'insight', 'actions', 'plan'];

// AC 2.2.2 — a starting value, not a requirement. Derived from the WHO figure
// the walk_30 action quotes (150 min / 30 min = 5), never from the user.
const DEFAULT_TARGET = 5;

export default function App() {
  // AC 1.2.4 — presentation preferences, remembered across visits. Neither
  // changes the meaning of any content, so neither is part of the health
  // profile and neither is ever written to the database.
  //
  // Language is persisted for the same reason text size is: a user who picks
  // BM and is silently returned to English on refresh has been told their
  // choice does not stick. Reading it lazily in useState (not in an effect)
  // means the first paint is already in the chosen language — no flash of
  // English before it corrects itself.
  const [lang, setLang] = useState(() => {
    const saved = globalThis.localStorage?.getItem('kirasihat.lang');
    return LANGS.includes(saved) ? saved : 'en';
  });
  const [textSize, setTextSize] = useState(() => {
    const saved = globalThis.localStorage?.getItem('kirasihat.textSize');
    return saved === 'large' || saved === 'normal' ? saved : 'normal';
  });
  const [screen, setScreen] = useState('welcome');
  const [reach, setReach] = useState('welcome');       // furthest screen unlocked
  const [draft, setDraft] = useState(EMPTY_DRAFT);     // held in memory only
  const [bands, setBands] = useState([]);
  const [selected, setSelected] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.documentElement.lang = lang === 'ms' ? 'ms' : 'en';
    globalThis.localStorage?.setItem('kirasihat.lang', lang);
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
        screeningBand: draft.lifestyle.includes('no_screening_3y') ? 'over_3y' : 'unknown',
        lifestyle: draft.lifestyle,
        language: lang,
      });
      // AC 2.2.2 — 5 is the default only because the walk_30 action quotes WHO
      // as 5 x 30 minutes, and the user can change it on the plan screen. A
      // one-off task is target 1: it is done or it is not.
      await saveGoal({
        actionKey: selected,
        target: isOneOff(selectedTopic) ? 1 : DEFAULT_TARGET,
        reminder: false,
      });
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
    setSelectedTopic('');
    setReach('welcome');
    setScreen('welcome');
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

      {screen === 'welcome' && (
        <Welcome {...shared} onStart={() => advance('profile')} />
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
          setSelectedTopic={setSelectedTopic}
          onSave={saveGoalAndPlan}
        />
      )}

      {screen === 'plan' && (
        <Plan {...shared} draft={draft} onRestart={restart} />
      )}
    </div>
  );
}
