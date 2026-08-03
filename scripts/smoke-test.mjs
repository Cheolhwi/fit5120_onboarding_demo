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
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => {
    if (!/Not implemented/.test(e.message)) console.error('jsdom:', e.message);
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
  check('F17', 'BM/EN toggle present', doc.querySelectorAll('.langtoggle button').length === 2);
  check('F01', 'Four age bands offered', doc.querySelectorAll('.band').length === 4);
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
  const band4049 = [...doc.querySelectorAll('.band')].find((b) => b.textContent.trim() === '40-49');
  await click(band4049);
  check('F04', 'Discloses the published band mapping', text().includes('41-59'),
    'shows "Closest official DOSM band: 41-59"');

  await setChecked(doc.querySelectorAll('.check input')[2], true);   // no screening 3y
  await setChecked(doc.querySelector('.consent input'), true);
  await click(byText('Continue'));
  await sleep(350);

  console.log('\nSCREEN 2 — official context');
  check('nav', 'Advanced to insight screen', text().includes('Your age group in the official data'));
  check('F08', '"Not a diagnosis" banner shown', text().includes('not a diagnosis'));
  check('F08', 'No personal risk percentage claimed', text().includes('No personal risk percentage'));
  check('F05', 'Leading cause from the database', text().includes('Ischaemic heart disease'));
  check('F05', 'Verified DOSM figures rendered', text().includes('5,380') && text().includes('17.6%'));
  check('F04', 'Mapping explained on screen', text().includes('40-49') && text().includes('41-59'));
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
  check('F10', 'WHO guidance named on the activity action', text().includes('WHO advises at least 150 minutes'));
  check('F11', 'Safety note on every action',
    (text().match(/Safety note:/g) || []).length === radios.length);
  check('F11', 'Urgent-symptom route always visible', text().includes('Chest pain, breathlessness or fainting'));

  await click(byText('Save as my weekly goal'));
  check('F09', 'Blocks save with nothing selected', text().includes('Choose one action to continue'));

  await setChecked(radios[0], true);
  await click(byText('Save as my weekly goal'));
  await sleep(500);

  console.log('\nSCREEN 4 — plan and screening');
  check('nav', 'Advanced to plan screen', text().includes('My plan'));
  check('F14', 'Goal saved and shown', text().includes('Walk 30 minutes'));
  check('F14', 'Progress starts at zero', text().includes('Done: 0 days'));
  const dots = [...doc.querySelectorAll('.dot')];
  check('F14', 'One dot per target day', dots.length === 5, `${dots.length} dots`);
  await click(dots[2]);
  check('F14', 'Marking a day updates progress', text().includes('Done: 3 days'));
  await click(dots[0]);
  check('F15', 'Progress can go down — no forced streak', text().includes('Done: 0 days'));
  check('F12', 'MySejahtera screening link present',
    !![...doc.querySelectorAll('a')].find((a) => a.href.includes('mysejahtera.moh.gov.my')));
  check('F13', 'Clinician questions listed', doc.querySelectorAll('.qlist li').length === 3);
  check('F15', 'Reminder is a toggle the user controls',
    !!doc.querySelector('.switch input[type="checkbox"]'));
  check('F16', 'Delete-my-data control reachable from the plan', !!byText('Delete my data'));

  console.log('\nBILINGUAL — switching to BM');
  await click(doc.querySelectorAll('.langtoggle button')[0]);
  await sleep(400);
  check('F17', 'Screen re-renders in Bahasa Melayu', text().includes('Pelan saya'));
  check('F17', 'Action content swaps language too', text().includes('Berjalan 30 minit'));
  check('F17', 'html lang attribute follows', doc.documentElement.lang === 'ms');

  console.log('\nSAFETY SWEEP — the whole session');
  const all = text();
  const forbidden = [/\b\d{1,3}%\s*(risk|chance|probability)/i, /your risk is/i, /you have a \d/i];
  check('F08', 'No personal risk claim anywhere in the flow',
    forbidden.every((re) => !re.test(all)));

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
