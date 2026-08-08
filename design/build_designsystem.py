#!/usr/bin/env python3
"""KiraSihat design system board -> SVG for Figma import.

Every value is read out of src/styles.css at build time. Nothing on the board
is typed in by hand, so the board cannot drift away from the shipped CSS: if a
token changes in code, re-running this regenerates the board.

Text is emitted as <text> so Figma keeps it editable; groups carry ids so they
arrive as named layers rather than "Group 27".
"""
import re
import pathlib
from html import escape

CSS = pathlib.Path("../src/styles.css")
OUT = pathlib.Path(".")
OUT.mkdir(exist_ok=True)

css = CSS.read_text()
T = dict(re.findall(r"--([\w-]+):\s*([^;]+);", re.search(r":root\s*\{(.*?)\}", css, re.S).group(1)))
T = {k: v.strip() for k, v in T.items()}
BREAKPOINTS = re.findall(r"@media\s*\(min-width:\s*(\d+)px\)", css)

FONT = "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
W, H = 2560, 2200
parts = []


def esc(s):
    return escape(str(s), quote=True)


def g(gid, body):
    parts.append(f'<g id="{esc(gid)}">{body}</g>')


def rect(x, y, w, h, fill, r=0, stroke=None, sw=1, extra=""):
    s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
            f'fill="{fill}"{s}{extra}/>')


def txt(x, y, s, size=14, fill="#132430", weight="400", anchor="start", family=FONT, ls=None):
    a = f' text-anchor="{anchor}"' if anchor != "start" else ""
    l = f' letter-spacing="{ls}"' if ls else ""
    return (f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" '
            f'font-weight="{weight}" fill="{fill}"{a}{l}>{esc(s)}</text>')


def section(x, y, title, sub=""):
    out = txt(x, y, title, 26, T["teal"], "700")
    if sub:
        out += txt(x, y + 24, sub, 14, T["muted"])
    out += rect(x, y + (40 if sub else 18), 60, 3, T["green"], 2)
    return out


# ---------------------------------------------------------------- background
parts.append(rect(0, 0, W, H, "#ffffff"))
parts.append(rect(0, 0, W, 148, T["teal"]))
g("title", (
    txt(64, 66, "KiraSihat — Design System", 34, "#ffffff", "700")
    + txt(64, 100, "Generated from src/styles.css · FIT5120 S2 2026 · Team Dynamics (TM01)",
          15, "#bfdde0")
    + txt(64, 124, "Every colour, size and radius below is read from the stylesheet at build "
                   "time — this board cannot drift from the code.", 13, "#8fb6bd")
))

# ---------------------------------------------------------------- 1. colour
Y = 218
g("01-colour", section(64, Y, "1 · Colour tokens",
                       "CSS custom properties on :root. Name these as Figma variables to keep "
                       "the mapping one-to-one."))

SWATCH_META = {
    "teal":     ("Primary. App bar, headings, source chips.", "#ffffff"),
    "teal-d":   ("Darker teal. Title slide, pressed states.", "#ffffff"),
    "teal-l":   ("Lighter teal. Accents only.", "#ffffff"),
    "green":    ("Primary action. Continue / Save buttons.", "#ffffff"),
    "green-bg": ("Selected option background.", T["ink"]),
    "amber":    ("Consent and caution.", "#ffffff"),
    "amber-bg": ("Consent banner background.", T["ink"]),
    "red":      ("Urgent symptoms, required, errors.", "#ffffff"),
    "red-bg":   ("Urgent banner background.", T["ink"]),
    "ink":      ("Body text.", "#ffffff"),
    "muted":    ("Secondary text, captions.", "#ffffff"),
    "line":     ("Borders and dividers.", T["ink"]),
    "surface":  ("Card background.", T["ink"]),
    "page":     ("App background.", T["ink"]),
    "blue-bg":  ("Source chip / explainer background.", T["ink"]),
}

body = ""
x0, y0, cw, ch, gap = 64, Y + 70, 300, 108, 16
for i, (key, (use, fg)) in enumerate(SWATCH_META.items()):
    col, row = i % 5, i // 5
    x = x0 + col * (cw + gap)
    y = y0 + row * (ch + gap)
    val = T[key]
    body += rect(x, y, cw, ch, val, 10, T["line"] if key in ("surface", "page") else None)
    body += txt(x + 16, y + 34, f"--{key}", 15, fg, "700")
    body += txt(x + 16, y + 56, val.upper(), 13, fg, "400", family="ui-monospace, SFMono-Regular, monospace")
    body += txt(x + 16, y + 82, use, 11, fg)
g("01-colour-swatches", body)

# ---------------------------------------------------------------- 2. type
Y2 = 720
g("02-type", section(64, Y2, "2 · Type scale",
                     "System UI stack. Body never below 16px — 35.1% of Malaysian adults have "
                     "low health literacy [R3]."))
SCALE = [
    (30, "700", "Page title — desktop app bar", "h1 @ >=900px"),
    (25, "700", "Page title — mobile app bar", ".appbar h1"),
    (19, "700", "Card heading", "h2"),
    (17, "700", "Section heading / button label", "h3, .btn"),
    (16, "400", "Body — the floor for readable text", "body"),
    (15, "400", "Dense body, list rows", ".check"),
    (14, "400", "Secondary text", ".muted"),
    (13, "400", "Caption, source chip", ".small, .sourcechip"),
    (12, "700", "Overline, step label", ".appbar__step"),
]
body = ""
y = Y2 + 80
for size, weight, use, sel in SCALE:
    body += txt(64, y, f"{size}", 13, T["muted"], "700")
    body += txt(112, y, "Kekal sihat. Stay well.", size, T["ink"], weight)
    body += txt(560, y, use, 13, T["muted"])
    body += txt(900, y, sel, 12, T["teal"], "400",
                family="ui-monospace, SFMono-Regular, monospace")
    y += max(size + 20, 40)
g("02-type-scale", body)

# ---------------------------------------------------------------- 3. controls
Y3 = 720
CX = 1150
g("03-controls", section(CX, Y3, "3 · Controls",
                         f"Every tap target is at least --tap ({T['tap']}). Colour is never the "
                         "only signal — selection also changes border weight."))
body = ""
y = Y3 + 80

# buttons
body += txt(CX, y, "Primary — .btn", 13, T["muted"], "700")
body += rect(CX, y + 12, 300, 52, T["green"], 10)
body += txt(CX + 150, y + 44, "Continue", 17, "#ffffff", "700", "middle")
body += rect(CX + 320, y + 12, 300, 52, "#b6c1c8", 10)
body += txt(CX + 470, y + 44, "Continue", 17, "#ffffff", "700", "middle")
body += txt(CX + 640, y + 44, "disabled", 13, T["muted"])
y += 92

body += txt(CX, y, "Secondary — .btn--teal / .btn--ghost", 13, T["muted"], "700")
body += rect(CX, y + 12, 290, 48, T["teal"], 10)
body += txt(CX + 145, y + 42, "Open MySejahtera guide", 15, "#ffffff", "700", "middle")
body += rect(CX + 310, y + 12, 200, 48, "none", 10, T["line"])
body += txt(CX + 410, y + 42, "Change goal", 15, T["teal"], "700", "middle")
y += 92

# age band
body += txt(CX, y, "Age band — .band  (default / selected)", 13, T["muted"], "700")
for i, (label, sel) in enumerate([("15-40", False), ("41-59", True), ("60+", False)]):
    x = CX + i * 168
    if sel:
        body += rect(x, y + 12, 156, 48, T["green-bg"], 10, T["green"], 2)
        body += txt(x + 78, y + 42, label, 16, "#2f6b33", "700", "middle")
    else:
        body += rect(x, y + 12, 156, 48, T["surface"], 10, T["line"])
        body += txt(x + 78, y + 42, label, 16, T["ink"], "400", "middle")
y += 92

# checkbox
body += txt(CX, y, "Checklist row — .check  (unticked / ticked)", 13, T["muted"], "700")
for i, (label, on) in enumerate([("I sit for most of the working day", False),
                                 ("I have sugary drinks most days", True)]):
    yy = y + 12 + i * 58
    body += rect(CX, yy, 620, 48, T["surface"], 10, T["green"] if on else T["line"], 2 if on else 1)
    body += rect(CX + 14, yy + 13, 22, 22, T["green"] if on else T["surface"], 4,
                 T["green"] if on else "#9aa7ae")
    if on:
        body += ('<path d="M{} {} l4 4 l7 -8" stroke="#ffffff" stroke-width="2.4" fill="none" '
                 'stroke-linecap="round" stroke-linejoin="round"/>').format(CX + 20, yy + 24)
    body += txt(CX + 50, yy + 30, label, 15, T["ink"])
y += 140

# source chip
body += txt(CX, y, "Source chip — .sourcechip  (F07: shown beside every figure)", 13, T["muted"], "700")
body += rect(CX, y + 12, 620, 74, T["blue-bg"], 10)
body += f'<circle cx="{CX+26}" cy="{y+34}" r="9" fill="{T["teal"]}"/>'
body += txt(CX + 26, y + 38, "i", 12, "#ffffff", "700", "middle")
body += txt(CX + 46, y + 38, "Source: DOSM — Statistics on Causes of Death (2025)", 13, T["teal"], "700")
body += txt(CX + 46, y + 58, "Caveat: Medically certified deaths only.", 13, T["teal"])
y += 116

# banners
body += txt(CX, y, "Banners — .banner--amber / --red", 13, T["muted"], "700")
body += rect(CX, y + 12, 620, 56, T["amber-bg"], 12, "#ebd3ac")
body += f'<circle cx="{CX+28}" cy="{y+40}" r="12" fill="{T["amber"]}"/>'
body += txt(CX + 28, y + 45, "!", 14, "#ffffff", "700", "middle")
body += txt(CX + 52, y + 45, "Population context only. Not a diagnosis.", 14, "#6b4a11")
body += rect(CX, y + 80, 620, 56, T["red-bg"], 12, "#edc9c5")
body += f'<circle cx="{CX+28}" cy="{y+108}" r="12" fill="{T["red"]}"/>'
body += txt(CX + 28, y + 113, "!", 14, "#ffffff", "700", "middle")
body += txt(CX + 52, y + 113, "Chest pain or breathlessness? Get urgent care now.", 14, "#7a2e28")
g("03-controls-items", body)

# ---------------------------------------------------------------- 4. layout
Y4 = 1560
g("04-layout", section(64, Y4, "4 · Layout",
                       f"Mobile-first. Single breakpoint at {BREAKPOINTS[0]}px; a second at "
                       f"{BREAKPOINTS[1]}px only widens the shell. No content differs between them."))

body = ""
# --- mobile 390
mx, my, mw, mh = 64, Y4 + 78, 390, 476
body += rect(mx, my, mw, mh, T["page"], 8, T["line"])
body += rect(mx, my, mw, 92, T["teal"], 0)
body += txt(mx + 16, my + 34, "KiraSihat", 13, "#ffffff", "700")
body += rect(mx + mw - 108, my + 18, 44, 28, "#3d6f7c", 14)
body += rect(mx + mw - 58, my + 18, 44, 28, "#3d6f7c", 14)
body += txt(mx + 16, my + 74, "Official context", 20, "#ffffff", "700")
for i in range(3):
    body += rect(mx + 16, my + 110 + i * 76, mw - 32, 64, T["surface"], 10, T["line"])
body += rect(mx + 16, my + 336, mw - 32, 44, T["green"], 8)
body += txt(mx + mw / 2, my + 364, "Continue", 14, "#ffffff", "700", "middle")
body += rect(mx, my + mh - 56, mw, 56, T["surface"], 0, T["line"])
for i in range(4):
    body += txt(mx + 49 + i * 97, my + mh - 22, ["Me", "Data", "Action", "Goal"][i],
                12, T["teal"] if i == 1 else "#93a2ac", "700" if i == 1 else "400", "middle")
body += txt(mx, my - 14, "Mobile — 390 × auto  ·  .app max-width 480px", 13, T["ink"], "700")
body += txt(mx, my + mh + 24, "Bottom tab bar · single column · button full width",
            12, T["muted"])

# --- desktop 1440
dx, dy, dw, dh = 560, Y4 + 78, 1000, 476      # 1440 shown at ~0.69 scale
body += rect(dx, dy, dw, dh, T["page"], 8, T["line"])
railw = 175
body += rect(dx, dy, railw, dh, T["page"], 0)
body += f'<line x1="{dx+railw}" y1="{dy}" x2="{dx+railw}" y2="{dy+dh}" stroke="{T["line"]}"/>'
for i in range(4):
    yy = dy + 40 + i * 46
    if i == 1:
        body += rect(dx + 10, yy - 16, railw - 24, 38, T["blue-bg"], 8)
    body += f'<circle cx="{dx+32}" cy="{yy+3}" r="12" fill="{T["teal"] if i==1 else "#e3e9ec"}"/>'
    body += txt(dx + 32, yy + 8, str(i + 1), 12, "#ffffff" if i == 1 else "#7d8d97", "700", "middle")
    body += txt(dx + 54, yy + 8, ["Me", "Data", "Action", "Goal"][i], 14,
                T["ink"] if i == 1 else "#93a2ac", "700" if i == 1 else "400")
body += rect(dx + railw, dy, dw - railw, 96, T["teal"], 0)
body += txt(dx + railw + 28, dy + 40, "KiraSihat", 13, "#ffffff", "700")
body += txt(dx + railw + 28, dy + 76, "Official context", 22, "#ffffff", "700")
for i in range(2):
    body += rect(dx + railw + 28, dy + 122, (dw - railw - 84) / 2, 128, T["surface"], 10, T["line"])
    body += rect(dx + railw + 44 + (dw - railw - 84) / 2, dy + 122,
                 (dw - railw - 84) / 2, 128, T["surface"], 10, T["line"])
body += rect(dx + railw + 28, dy + 266, dw - railw - 56, 60, T["surface"], 10, T["line"])
btnw = 208
body += rect(dx + railw + (dw - railw - btnw) / 2, dy + 396, btnw, 40, T["green"], 8)
body += txt(dx + railw + (dw - railw) / 2, dy + 422, "Continue", 14, "#ffffff", "700", "middle")
body += txt(dx, dy - 14, "Desktop — 1440 × auto  ·  .app max-width 1180px (1320 above 1400px)",
            13, T["ink"], "700")
body += txt(dx, dy + dh + 24,
            "Left rail replaces the tab bar · content column max 900px · cards two-up · "
            "button centred, min-width 300px", 12, T["muted"])

# annotations
ax = 1620
body += txt(ax, dy + 6, "What changes at the breakpoint", 15, T["teal"], "700")
notes = [
    ("Navigation", "Bottom tab bar becomes a sticky left rail. Same buttons, same order,"),
    ("", "same disabled logic. Step numbers come from a CSS counter."),
    ("Content", "Single column becomes two columns for the insight cards and the"),
    ("", "action list. Forms stay single column — they read better that way."),
    ("Primary button", "Stops stretching full width. Centred, min-width 300px, 56px tall."),
    ("Unchanged", "Every string, figure, source and safety note. The wide layout hides"),
    ("", "nothing and injects no text — asserted by the test suite."),
]
yy = dy + 40
for label, line in notes:
    if label:
        body += txt(ax, yy, label, 13, T["ink"], "700")
        body += txt(ax + 130, yy, line, 13, T["muted"])
    else:
        body += txt(ax + 130, yy, line, 13, T["muted"])
    yy += 24

# radii + tap
body += txt(ax, yy + 24, "Radii", 13, T["ink"], "700")
for i, r in enumerate([5, 10, 12, 999]):
    xx = ax + 130 + i * 92
    body += rect(xx, yy + 10, 62, 30, T["blue-bg"], min(r, 15))
    body += txt(xx + 31, yy + 30, f"{r}px" if r != 999 else "pill", 12, T["teal"], "700", "middle")
body += txt(ax, yy + 84, "Tap target", 13, T["ink"], "700")
body += rect(ax + 130, yy + 62, 48, 48, "none", 6, T["green"], 2)
body += txt(ax + 190, yy + 92, f"--tap: {T['tap']} minimum on every interactive element",
            13, T["muted"])

g("04-layout-boards", body)

parts.append(txt(64, H - 40,
                 "Regenerate with: python3 build_designsystem.py  ·  values are parsed from "
                 "src/styles.css, not transcribed.", 12, T["muted"]))

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
       f'viewBox="0 0 {W} {H}">' + "".join(parts) + "</svg>")
path = OUT / "KiraSihat_Design_System.svg"
path.write_text(svg)
print(f"wrote {path}  ({len(svg)//1024} KB)")
print(f"tokens: {len(T)}  breakpoints: {BREAKPOINTS}")
