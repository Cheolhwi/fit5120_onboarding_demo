# Getting KiraSihat into Figma

There is no way to generate a `.fig` file. The format is proprietary and
undocumented, and Figma's REST API can read a file's contents but cannot create
nodes in one — only a plugin running inside Figma can write. So this folder
contains the part that is worth generating, plus instructions for the part that
is better captured from the running app than redrawn.

---

## 1. The design system board (in this folder)

`KiraSihat_Design_System.svg` — colour tokens, type scale, control states and
the mobile/desktop layout skeletons.

**Import:** open a Figma file → `File ▸ Place image…`, or just drag the SVG onto
the canvas. Figma converts it into editable vectors and live text layers, and
the `<g id="…">` groups arrive as named layers (`01-colour-swatches`,
`03-controls-items`, `04-layout-boards`).

**Why generate this rather than draw it:** every hex value, font size, radius
and breakpoint on the board is parsed out of `src/styles.css` when the script
runs. Nothing is transcribed by hand, so the board cannot quietly disagree with
the shipped CSS. If a token changes, regenerate:

```bash
python3 build_designsystem.py
```

**Next step inside Figma:** select each swatch and save it as a Figma **variable**
using the same name shown on the swatch (`--teal`, `--green-bg`, …). That keeps
a one-to-one mapping between the design file and the stylesheet, so a reviewer
can check one against the other.

### What this board is not

It is a static picture. Figma auto-layout, components, variants and interactive
prototyping have to be built by hand — an SVG cannot carry them.

---

## 2. The four screens — capture them, don't redraw them

Redrawing screens by hand produces a design file that is already slightly wrong
the day it is made. Import the real rendered app instead.

1. Start the app:

   ```bash
   npm run dev          # http://localhost:5173
   ```

2. In Figma, install the **html.to.design** plugin from the Community tab.

3. Run it and give it `http://localhost:5173`. Set the viewport width to **390**
   for the mobile board and **1440** for the desktop board, and import each
   screen twice.

4. Walk the flow in the browser before each capture — the plugin captures what
   is currently on screen:

   | Board | How to reach it |
   |---|---|
   | 1 · Context profile | fresh load |
   | 2 · Official context | pick an age band, tick consent, Continue |
   | 3 · Choose one action | Continue again |
   | 4 · My plan (weekly) | select *Walk 30 minutes*, save |
   | 4b · My plan (one-off) | *Start again* → select *Book a health screening*, save |

Board 4b matters: a booking renders as a single task with no day-counter, and a
design file that only shows the weekly variant hides half the behaviour.

### Worth capturing too

- **BM as well as EN.** Malay strings are longer; the layout has to hold. Toggle
  BM in the app bar and re-capture at least screens 1 and 2.
- **The A+ text size.** Everything scales up and no content is dropped. This is
  acceptance criterion 1.2.4 and is easier to show than to describe.

---

## 3. If you cannot install plugins

Use the browser instead:

```
DevTools ▸ ⌘⇧M (device toolbar) ▸ set width 390 or 1440
⌘⇧P ▸ "Capture full size screenshot"
```

Drag the PNGs into Figma as reference images. They are flat — no editable layers
— but they are accurate, which for a report appendix is usually what matters.

---

## Honest summary of each route

| Route | Editable layers | Matches the build | Effort |
|---|---|---|---|
| Design system SVG (this folder) | yes | yes — parsed from CSS | done |
| html.to.design import | yes | yes — captures the real DOM | ~15 min |
| Full-page screenshots | no | yes | ~5 min |
| Redrawing screens by hand | yes | drifts immediately | hours |
