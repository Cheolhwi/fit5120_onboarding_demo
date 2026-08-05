#!/usr/bin/env node
/**
 * End-to-end smoke test against the real production bundle.
 *
 *   npm run build:mock && node scripts/smoke-test.mjs
 *
 * Loads the built app in jsdom, walks the four screens, and asserts that each
 * Must-have MVP feature (F01–F17) is actually present and behaves. This is not
 * a substitute for looking at it in a browser, but it does catch the things
 * that silently break: missing strings, broken data reads, dead buttons.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = process.env.SMOKE_DIST || join(ROOT, "dist-mock");

const results = [];
const check = (id, label, ok, detail = '') => {
  results.push({ id, label, ok, detail });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${id.padEnd(5)} ${label}${detail ? ` — ${detail}` : ''}`);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function bundle() {
  const assets = join(DIST, 'assets');
  const js = readdirSync(assets).find((f) => f.endsWith('.js'));
  if (!js) throw new Error('No built JS found. Run: npm run build:mock');
  return readFileSync(join(assets, js), 'utf8');
}

async function main() {
  // An uncaught exception in the app must fail the run. Previously these were
  // only printed, so a dead click handler could still leave every check green.
  const runtimeErrors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => {
    if (/Not implemented/.test(e.message)) return;
    runtimeErrors.push(e.message.split('\n')[0]);
    console.error('  jsdom:', e.message.split('\n')[0]);
  });

  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    runScripts: 'outside-only',
    url: 'http://localhost/',
    pretendToBeVisual: true,
    virtualConsole: vc,
  });

  const { window } = dom;
  window.scrollTo = () => {};
  window.confirm = () => true;
  window.alert = () => {};
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });

  // Run the real bundle.
  window.eval(bundle());
  await sleep(300);

  const doc = window.document;
  const text = () => doc.body.textContent || '';
  const byText = (needle, sel = 'button, a, label, legend') =>
    [...doc.querySelectorAll(sel)].find((el) => (el.textContent || '').includes(needle));
  const click = async (el) => {
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await sleep(120);
  };
  const setChecked = async (el, value) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked').set;
    setter.call(el, value);
    el.dispatchEvent(new window.Event('click', { bubbles: true }));
    await sleep(120);
  };

  console.log('\nSCREEN 1 — context profile');
  check('boot', 'App mounts', doc.querySelector('.appbar') !== null);
  // Two toggle groups now: text size (A / A+) and language (BM / EN).
  const toggle = (label) =>
    [...doc.querySelectorAll('.langtoggle button')].find((b) => b.textContent.trim() === label);
  check('F17', 'BM/EN toggle present', !!toggle('BM') && !!toggle('EN'));
  check('AC124', 'Text size toggle present', !!toggle('A') && !!toggle('A+'));
  check('F01', 'Age bands offered are DOSM\'s own', doc.querySelectorAll('.band').length === 3,
    [...doc.querySelectorAll('.band')].map((b) => b.textContent.trim()).join(' / '));
  check('F02', 'Lifestyle checklist rendered', doc.querySelectorAll('.check input').length === 4);
  check('F03', 'Consent checkbox present', doc.querySelector('.consent input') !== null);
  check(
    'A11y',
    'Tap targets declared >= 48px',
    readFileSync(join(DIST, 'assets', readdirSync(join(DIST, 'assets')).find((f) => f.endsWith('.css'))), 'utf8')
      .includes('--tap: 48px')
  );

  // F03 — the gate must actually block.
  await click(byText('Continue'));
  check('F03', 'Blocks continue without age band + consent', doc.querySelector('.error') !== null);

  // Fill it in.
  const band = [...doc.querySelectorAll('.band')].find((b) => b.textContent.trim() === '41-59');
  await click(band);
  check('F04', 'States that the bands are DOSM\'s published groups',
    text().includes('age groups DOSM publishes'));
  // Structural, not textual: the page *says* "we never ask for your date of
  // birth", so searching for that phrase would always match. Check that no
  // control capable of capturing an exact age exists.
  check('F01', 'No control captures an exact age',
    doc.querySelectorAll('input[type="date"], input[type="number"]').length === 0);
  check('F01', 'Minimum-data promise is shown to the user',
    /date of birth/i.test(text()));

  // AC 1.1.1 — data minimisation has to be true, not just promised. "State"
  // was collected and never read; a field with no consumer must not come back.
  const selects = [...doc.querySelectorAll('select')];
  check('AC111', 'No field is collected without a use',
    selects.length === 1, `${selects.length} optional select(s)`);
  check('AC111', 'The removed state field has not returned',
    !selects.some((el) => /selangor|johor|sabah/i.test(el.textContent)));
  // The desktop rail is the bottom tab bar restyled, so it has to exist on
  // screen 1 too — otherwise the sidebar appears out of nowhere on step 2.
  // Showing it does not unlock anything: later steps stay disabled.
  const navBtns = [...doc.querySelectorAll('.nav button')];
  check('desktop', 'Navigation is present on the first screen', navBtns.length === 4,
    `${navBtns.length} items`);
  check('desktop', 'Unreached steps are still locked on the first screen',
    navBtns.filter((b) => b.disabled).length === 3);
  check('desktop', 'The current step is marked for assistive tech',
    navBtns[0]?.getAttribute('aria-current') === 'page');

  check('AC111', 'Each remaining optional input says why it is asked',
    text().includes('We do not ask for anything we do not use') &&
    text().includes('never used to score your personal risk'));

  await setChecked(doc.querySelectorAll('.check input')[1], true);   // sugary drinks -> diet
  await setChecked(doc.querySelectorAll('.check input')[2], true);   // no screening 3y -> screening
  await setChecked(doc.querySelectorAll('.check input')[3], true);   // smoker -> no content
  // AC 1.1.3 — summary separates fixed from changeable and reflects live edits.
  check('AC113', 'Profile summary is shown', !!doc.querySelector('.summary'));
  check('AC113', 'Fixed factors are named as fixed',
    text().includes('Fixed — used only to pick the right published data'));
  check('AC113', 'Changeable factors are named separately',
    text().includes('Changeable — what an action can address'));
  check('AC113', 'Summary reflects the ticked answers',
    doc.querySelector('.summary__block--change ul')?.children.length === 3);
  check('AC113', 'Summary shows the chosen age band',
    doc.querySelector('.summary__block--fixed')?.textContent.includes('41-59'));
  check('safety', 'Changeable split makes no personal-risk claim',
    !/your risk|lowers? your|reduces? your/i.test(
      doc.querySelector('.summary')?.textContent ?? ''));

  // AC 1.2.4 — larger text changes size only.
  const beforeLarge = text();
  await click(toggle('A+'));
  const wentLarge = !!doc.querySelector('.app--lg');
  check('AC124', 'Larger text setting applies', wentLarge);
  // Gated on the toggle having worked, so a dead control cannot pass this.
  check('AC124', 'Content is identical at the larger size',
    wentLarge && text() === beforeLarge);
  await click(toggle('A'));
  check('AC124', 'Normal text setting restores',
    wentLarge && !doc.querySelector('.app--lg'));

  await setChecked(doc.querySelector('.consent input'), true);
  await click(byText('Continue'));
  await sleep(350);

  console.log('\nSCREEN 2 — official context');
  check('nav', 'Advanced to insight screen', text().includes('Your age group in the official data'));
  check('F08', '"Not a diagnosis" banner shown', text().includes('not a diagnosis'));
  check('F08', 'No personal risk percentage claimed', text().includes('No personal risk percentage'));
  check('F05', 'Leading cause from the database', text().includes('Ischaemic heart disease'));
  check('F05', 'Verified DOSM figures rendered', text().includes('5,380') && text().includes('17.6%'));
  check('F04', 'Header names the official band being shown', text().includes('41-59'));
  check('F07', 'Source label with owner + licence', text().includes('Department of Statistics Malaysia'));
  check('F07', 'Caveat shown beside the figure', text().includes('67.3%'));
  check('F06', '"What this means" panel', text().includes('What this means for you'));
  check('data', 'NHMS factors rendered', text().includes('High cholesterol') && text().includes('33.3%'));

  await click(byText('See what I can do'));
  await sleep(350);

  console.log('\nSCREEN 3 — choose one action');
  check('nav', 'Advanced to actions screen', text().includes('Choose one action for this week'));
  const radios = [...doc.querySelectorAll('input[type="radio"][name="action"]')];
  check('F09', 'Two or three sourced actions offered', radios.length >= 2 && radios.length <= 3,
    `${radios.length} actions`);
  check('F09', 'First step given for each action', (text().match(/First step:/g) || []).length === radios.length);
  // Matches the WHO fact sheet wording: "at least 150–300 minutes of
  // moderate-intensity aerobic physical activity ... throughout the week".
  check('F10', 'WHO guidance quoted accurately on the activity action',
    /WHO/.test(text()) && /150[–-]300 minutes/.test(text()));
  check('F11', 'Safety note on every action',
    (text().match(/Safety note:/g) || []).length === radios.length);
  check('F11', 'Urgent-symptom route always visible', text().includes('Chest pain, breathlessness or fainting'));

  // F02 — the checklist must visibly change this screen, or it is decoration.
  const cards = [...doc.querySelectorAll('.action')];
  const titleOf = (c) => c.querySelector('.action__title')?.textContent.trim() ?? '';
  const matched = cards.filter((c) => c.textContent.includes('Matches what you told us'));
  check('F02', 'Ticked answers are matched to action topics', matched.length === 2,
    matched.map(titleOf).join(' | '));
  check('F02', 'Matched actions are ordered first',
    cards.slice(0, 2).every((c) => c.textContent.includes('Matches what you told us')));
  check('F02', 'Unmatched actions are still offered, not withheld', cards.length === 3);
  check('F02', 'Ordering is explained to the user', text().includes('Ordered by what you ticked'));
  // The honesty case: a ticked box with no reviewed content says so.
  check('F02', 'Ticked smoking states that no reviewed content exists',
    text().includes('no reviewed quit-support content'));
  check('safety', 'No quit-smoking action was invented to fill the gap',
    !/quit smoking|stop smoking/i.test(cards.map(titleOf).join(' ')));

  await click(byText('Save as my weekly goal'));
  check('F09', 'Blocks save with nothing selected', text().includes('Choose one action to continue'));

  // Pick the top-ranked action and remember it, so screen 4 can be checked
  // against what was actually chosen rather than a hardcoded title.
  const chosenCard = radios[0].closest('.action');
  const chosenTitle = titleOf(chosenCard);
  await setChecked(radios[0], true);
  await click(byText('Save as my weekly goal'));
  await sleep(500);

  console.log('\nSCREEN 4 — plan and screening');
  check('nav', 'Advanced to plan screen', text().includes('My plan'));
  check('F14', 'The goal saved is the one the user selected',
    text().includes(chosenTitle), `"${chosenTitle}"`);
  check('F14', 'Progress starts at zero', text().includes('Done: 0 days'));
  const dots = [...doc.querySelectorAll('.dot')];
  check('F14', 'One dot per target day', dots.length === 5, `${dots.length} dots`);
  await click(dots[2]);
  check('F14', 'Marking a day updates progress', text().includes('Done: 3 days'));
  await click(dots[0]);
  check('F15', 'Progress can go down — no forced streak', text().includes('Done: 0 days'));
  check('F12', 'MySejahtera screening link present',
    !![...doc.querySelectorAll('a')].find((a) => a.href.includes('mysejahtera.moh.gov.my')));
  check('F12', 'Says which published criterion the user matched',
    text().includes('both published criteria'),
    'age 41-59 + no screening in 3 years');
  check('F13', 'Clinician questions listed', doc.querySelectorAll('.qlist li').length === 3);
  check('F15', 'Reminder is a toggle the user controls',
    !!doc.querySelector('.switch input[type="checkbox"]'));
  check('F16', 'Delete-my-data control reachable from the plan', !!byText('Delete my data'));
  check('AC222', 'Complete control is offered alongside stop', !!byText('Mark as complete'));

  // AC 2.2.4 — the source and safety note must survive saving. Before this was
  // fixed the plan card showed the action title alone, so the screen the user
  // returns to weekly was the one screen with no provenance on it.
  const planCard = doc.querySelector('.card--teal');
  check('AC224', 'Saved plan still shows the source of the action',
    !!planCard?.querySelector('.sourcechip'));
  check('AC224', 'Saved plan still shows the safety note',
    !!planCard?.querySelector('.action__safety'));
  check('AC224', 'Source on the plan links out to the publisher',
    !!planCard?.querySelector('.sourcechip a[href^="http"]'));

  // AC 2.2.2 — the weekly target belongs to the user, not to the code.
  const targets = [...doc.querySelectorAll('.targetopt')];
  check('AC222', 'Weekly target is settable, 1 to 7 days', targets.length === 7,
    `${targets.length} options`);
  check('AC222', 'Default target is 5 and shown as pressed',
    targets[4]?.getAttribute('aria-pressed') === 'true');
  check('AC222', 'Default is attributed to WHO guidance, not to the user',
    text().includes('comes from the WHO guidance'));
  await click(dots[2]);                    // log 3 days, then shrink the target
  await click(targets[1]);                 // choose 2 days a week
  await sleep(250);
  check('AC222', 'Changing the target updates the goal',
    text().includes('Target: 2 days'));
  check('AC222', 'Lowering the target clamps progress instead of losing it',
    text().includes('Done: 2 days'));
  check('AC222', 'Dot count follows the new target',
    doc.querySelectorAll('.dot').length === 2);
  // Assert the reassurance is present rather than sweeping for "fail" — the
  // copy itself contains the word ("not a failure"), so a negative sweep here
  // would fail on the very sentence that makes the guarantee.
  check('AC222', 'A lower target is explicitly not framed as failure',
    text().includes('is not a failure'));
  check('AC222', 'No shortfall is scolded', !/not enough|too few|you should be doing/i.test(text()));
  await click([...doc.querySelectorAll('.targetopt')][4]);   // back to 5
  await sleep(250);

  console.log('\nBILINGUAL — switching to BM');
  const goalTitleEn = doc.querySelector('.card--teal h2')?.textContent.trim();
  await click(toggle('BM'));
  await sleep(400);
  const goalTitleMs = doc.querySelector('.card--teal h2')?.textContent.trim();
  check('F17', 'Screen re-renders in Bahasa Melayu', text().includes('Pelan saya'));
  // Content comes from action_content rows keyed by language, so the saved
  // goal's title must change with the toggle — whichever action was chosen.
  check('F17', 'Action content swaps language too',
    !!goalTitleMs && goalTitleMs !== goalTitleEn, `${goalTitleEn} -> ${goalTitleMs}`);
  check('F17', 'html lang attribute follows', doc.documentElement.lang === 'ms');

  // AC 2.2.2 — done last, because completing removes the goal card the
  // bilingual checks above read from.
  console.log('\nCOMPLETING A GOAL');
  await click(toggle('EN'));
  await sleep(300);
  await click(byText('Mark as complete'));
  await sleep(350);
  check('AC222', 'Completing clears the active goal and confirms it',
    text().includes('Goal completed'));
  check('AC222', 'A new goal can be started afterwards', !!byText('Start again'));
  check('AC222', 'Completing is not gated on hitting the target',
    !/must complete|reach your target/i.test(text()));

  // Booking a screening is a single task, not a habit. Rendering it as a weekly
  // counter asked the user to tick six more day-dots for an appointment they had
  // already made. Start a fresh goal on the screening action and check the plan
  // screen switches shape.
  console.log('\nONE-OFF TASK — booking a screening is not a weekly habit');
  await click(byText('Start again'));
  await sleep(400);
  const screeningRadio = [...doc.querySelectorAll('.action')]
    .find((c) => /screening/i.test(c.querySelector('.action__title')?.textContent ?? ''))
    ?.querySelector('input[type="radio"]');
  check('oneoff', 'Screening action is offered', !!screeningRadio);
  await setChecked(screeningRadio, true);
  await click(byText('Save as my weekly goal'));
  await sleep(600);

  check('oneoff', 'Plan for a booking shows no day-by-day counter',
    doc.querySelectorAll('.dot').length === 0,
    `${doc.querySelectorAll('.dot').length} dots`);
  check('oneoff', 'Plan for a booking shows no weekly target picker',
    doc.querySelectorAll('.targetopt').length === 0);
  check('oneoff', 'It is named as a one-off task',
    text().includes('one-off appointment, not a weekly habit'));
  check('oneoff', 'Booking instructions are given', text().includes('How to book'));
  check('oneoff', 'What the user needs to bring is stated',
    /MyKad or passport number/.test(text()));
  const links = [...doc.querySelectorAll('a')].map((a) => a.href);
  check('oneoff', 'MySejahtera route offered',
    links.some((h) => h.includes('mysejahtera.moh.gov.my')));
  check('oneoff', 'Official MyGovernment service listing offered as a second route',
    links.some((h) => h.includes('malaysia.gov.my') && h.includes('booking-an-appointment')));
  check('oneoff', 'The screening prompt is not duplicated on the same screen',
    (text().match(/Open MySejahtera screening guide/g) || []).length === 1);

  const bookBox = doc.querySelector('.book__done input');
  check('oneoff', 'A single done control is offered', !!bookBox);
  await setChecked(bookBox, true);
  await sleep(300);
  check('oneoff', 'Marking it booked is acknowledged', text().includes('Booked.'));
  await setChecked(doc.querySelector('.book__done input'), false);
  await sleep(300);
  check('oneoff', 'Marking booked is reversible', text().includes('I have booked my appointment'));
  check('oneoff', 'Not having booked yet is not framed as a failure',
    text().includes('nothing is counted against you'));

  // AC 1.2.4 — a real reload, not a re-render. The app is torn down and the
  // production bundle is booted a second time in a fresh window, carrying over
  // only what a browser would carry: localStorage. Asserting on localStorage
  // directly would only prove we wrote a key, not that we read it back.
  console.log('\nRELOAD — preferences must survive');
  await click(toggle('BM'));
  await click(toggle('A+'));
  await sleep(350);
  // Storage is not a plain object — enumerate it the way the spec exposes it
  // rather than spreading, which can silently yield {} and make the reload
  // "pass" by starting from a blank slate.
  const saved = {};
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const k = window.localStorage.key(i);
    saved[k] = window.localStorage.getItem(k);
  }
  check('AC124', 'Language choice is written to storage', saved['kirasihat.lang'] === 'ms',
    saved['kirasihat.lang']);
  check('AC124', 'Reload fixture actually carries state over', Object.keys(saved).length >= 2,
    `${Object.keys(saved).length} keys`);

  const dom2 = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    runScripts: 'outside-only',
    url: 'http://localhost/',
    pretendToBeVisual: true,
    virtualConsole: vc,
  });
  const w2 = dom2.window;
  w2.scrollTo = () => {};
  w2.confirm = () => true;
  w2.alert = () => {};
  w2.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  for (const [k, v] of Object.entries(saved)) w2.localStorage.setItem(k, v);
  w2.eval(bundle());
  await sleep(700);

  const doc2 = w2.document;
  const text2 = () => doc2.body.textContent.replace(/\s+/g, ' ');
  check('AC124', 'Bahasa Melayu survives a browser refresh',
    /Beritahu kami|Pelan saya|Jantina/.test(text2()),
    text2().slice(0, 40));
  check('AC124', 'html lang is correct on first paint after refresh',
    doc2.documentElement.lang === 'ms');
  check('AC124', 'Larger text also survives a refresh', !!doc2.querySelector('.app--lg'));
  // The health profile is deliberately in-memory only, so a refresh must land
  // back on screen 1. Checked structurally so it holds in either language.
  check('AC124', 'Refresh does not restore the in-memory health profile',
    !!doc2.querySelector('.bandgrid'));

  // jsdom has no layout engine, so the desktop layout cannot be rendered here.
  // What can be checked is the claim that matters: the wide layout is purely
  // presentational. If the media query ever hides an element or injects words,
  // the two viewports stop saying the same thing and that must fail loudly.
  console.log('\nDESKTOP LAYOUT — presentation only');
  const cssFile = readdirSync(join(DIST, 'assets')).find((f) => f.endsWith('.css'));
  const css = cssFile ? readFileSync(join(DIST, 'assets', cssFile), 'utf8') : '';
  // Locate the breakpoint by regex, not indexOf on an exact string: minifiers
  // disagree about the space in "min-width: 900px". indexOf returning -1 would
  // make slice() hand back one character, and every check below would then pass
  // against almost-empty input — green, and meaningless.
  const at = css.search(/@media\s*\(\s*min-width:\s*900px\s*\)/);
  const wide = at === -1 ? '' : css.slice(at);
  check('desktop', 'A desktop breakpoint is actually shipped in the bundle',
    at !== -1 && /\.nav\{?[^}]*grid-area/.test(wide.replace(/\s+/g, '')),
    at === -1 ? 'breakpoint not found in built CSS' : '');
  check('desktop', 'The wide layout hides nothing',
    at !== -1 && !/display:\s*none/.test(wide));
  // content: is allowed only for the step counter, never for literal words.
  const injected = [...wide.matchAll(/content:\s*("([^"]*)"|'([^']*)')/g)]
    .map((m) => m[2] ?? m[3]).filter((v) => v.trim() !== '');
  check('desktop', 'The wide layout injects no untranslated text',
    at !== -1 && injected.length === 0, injected.join(' | '));
  check('desktop', 'Step numbers come from a counter, not hardcoded strings',
    /counter\(navstep\)/.test(wide));
  check('desktop', 'Mobile remains the default, not an override',
    at !== -1 && at > css.search(/\.app\s*\{/));
  // A layout class defined only inside the breakpoint leaves every phone with
  // an unstyled container. Any class used in JSX must exist in the base sheet.
  const base = at === -1 ? css : css.slice(0, at);
  for (const cls of ['actionlist', 'cols', 'summary', 'targetrow']) {
    check('desktop', `.${cls} is styled at mobile width too`,
      new RegExp(`\\.${cls}\\s*\\{`).test(base));
  }

  console.log('\nSAFETY SWEEP — the whole session');
  const all = text();
  const forbidden = [/\b\d{1,3}%\s*(risk|chance|probability)/i, /your risk is/i, /you have a \d/i];
  check('F08', 'No personal risk claim anywhere in the flow',
    forbidden.every((re) => !re.test(all)));
  check('runtime', 'No uncaught errors during the whole session',
    runtimeErrors.length === 0, runtimeErrors.join(' | '));

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length) {
    console.log('Failed: ' + failed.map((f) => `${f.id} ${f.label}`).join(' | '));
    process.exit(1);
  }
  console.log('All MVP features F01–F17 verified against the built bundle.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
