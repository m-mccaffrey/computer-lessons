# COMPUTERS — A Course for Two Kids
## Website build specification

**Audience for this document:** Claude Code, working in an empty git repo.
**Audience for the thing being built:** a 7-year-old and a 9-year-old sitting at Raspberry Pi 400s, plus the parent teaching them.

Read this whole file before writing code. It is the source of truth for structure, design, and content model. Section 17 contains the full curriculum data. Section 18 contains Lesson 1 written out completely as the reference implementation — match its shape when generating everything else.

---

## 0. How to use this document

1. Read sections 1–16 for architecture and conventions.
2. Execute the build phases in section 15, in order. Do not skip ahead to content generation before the deck engine works.
3. Copy `CLAUDE.md` (section 15.0) into the repo root so future sessions inherit the conventions.
4. Section 17's curriculum block becomes `src/content/curriculum.yaml` verbatim. Generate lesson stubs from it programmatically, not by hand.
5. When something here is underspecified, prefer the simplest thing that works and leave a `TODO(human):` comment rather than inventing pedagogy. The curriculum is the human's; the website is yours.

---

## 1. Project goals and constraints

**What this is.** A ~56-lesson course teaching two children to be competent, unafraid, non-mystified computer users. Not a computer science course. Not an engineering course. The through-line is: *a competent adult should be able to buy a computer, drive it, make documents with it, understand why it's slow, not lose their files, not get scammed, and not be afraid of it.*

**Why a website instead of slide decks.** Three reasons, in priority order:

1. Interactive applets. A binary counter you can click beats a picture of one. A pixel grid that computes its own file size as you paint teaches Unit 3 in a way slides cannot.
2. Authoring in text. Lessons are Markdown, not drag-and-drop.
3. Longevity and reuse. It outlives the family, and the kids can eventually read its source.

**Hard constraints.**

- Deploys to GitHub Pages. Static output only. No server, no database, no build-time API calls.
- Must work offline once loaded, because home internet failing must not cancel a lesson. Service worker, precache everything.
- Must run acceptably on a Raspberry Pi 400 in Chromium. This is the binding performance constraint. The Pi 400 is a 1.8 GHz Cortex-A72 with 4 GB RAM. Budget: **under 200 KB of JS on a lesson page**, no heavy framework runtime shipped to the client, no 60fps canvas animation running continuously in the background.
- Two kids will be looking at two Pi 400 screens while the parent presents from a laptop. Design for a projected/shared screen *and* for individual reading.

**Non-goals.** User accounts. Any backend. Any analytics. Any tracking of the children whatsoever. Grading, scoring, gamification, streaks, badges. Comments. A CMS.

---

## 2. Audiences and modes

The site serves three distinct reading situations. Do not collapse them into one.

| Mode | Who | When | Route |
|---|---|---|---|
| **Deck** | Kids, on screen | During the lesson | `/lessons/01/` |
| **Guide** | Parent | Prepping, night before | `/lessons/01/guide/` |
| **Reference** | Both, later | Looking something up | `/glossary/`, `/curriculum/` |

The deck is nearly wordless — big type, one idea per slide. The guide holds the prose: props to gather, timing, what to say, what goes wrong, extra problems, answers. **Content that belongs in the guide must never leak onto a slide.** The most common failure mode for generated decks is pasting the teacher's paragraph onto the slide; do not do this.

Both come from the same source file. Slide body is the slide; `<Notes>` inside a slide, plus the frontmatter guide fields, compose the guide page.

---

## 3. Tech stack

**Astro 5**, static output, MDX content, zero client JS by default.

Rationale, since you may be tempted to change it: Astro ships no framework runtime unless asked, which respects the Pi 400 constraint; it renders MDX to static HTML at build time; and interactive applets can be plain custom elements rather than framework components, so they survive the site outliving Astro.

```
astro                 static site generator
@astrojs/mdx          lesson authoring
@astrojs/sitemap      nice to have
astro-icon or inline  no icon library dependency; inline SVG only
```

**Explicitly not used:** React, Vue, Svelte, Tailwind, any CSS framework, any UI kit, any charting library. Write CSS by hand against the token system in section 8. Applets are vanilla custom elements. If a chart is needed, draw the SVG.

**Node** ≥ 20 for the build. The build happens on GitHub Actions and on the parent's laptop, never on the Pi.

---

## 4. Repository layout

```
/
├── CLAUDE.md                      repo conventions (section 15.0)
├── BUILD-SPEC.md                  this file
├── astro.config.mjs
├── package.json
├── public/
│   ├── fonts/                     self-hosted woff2, subset
│   ├── media/                     images, per-lesson subfolders
│   └── sw.js                      service worker
├── scripts/
│   ├── scaffold-lessons.mjs       generates stubs from curriculum.yaml
│   └── check-content.mjs          lint rules from section 16
├── src/
│   ├── content/
│   │   ├── curriculum.yaml        section 17, verbatim
│   │   ├── config.ts              content collection schema
│   │   ├── lessons/
│   │   │   ├── 01-what-is-a-computer.mdx
│   │   │   ├── 02-...mdx
│   │   │   └── ... 56 files
│   │   ├── units/
│   │   │   └── 00-what-is-this-thing.md   unit intro prose
│   │   └── glossary/
│   │       └── terms.yaml
│   ├── components/
│   │   ├── deck/                  engine: Deck, Slide, Notes, Nav, Overview
│   │   ├── slides/                layout components (section 9)
│   │   └── applets/               custom elements (section 11)
│   ├── layouts/
│   │   ├── DeckLayout.astro
│   │   ├── GuideLayout.astro
│   │   └── PageLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── curriculum.astro
│   │   ├── materials.astro
│   │   ├── glossary.astro
│   │   ├── applets/index.astro
│   │   ├── units/[unit].astro
│   │   └── lessons/
│   │       ├── [lesson]/index.astro
│   │       └── [lesson]/guide.astro
│   └── styles/
│       ├── tokens.css             the design system, single source
│       ├── deck.css
│       └── prose.css
└── .github/workflows/deploy.yml
```

---

## 5. Content model

`src/content/config.ts` defines the lessons collection. Schema:

```ts
{
  n: number,                 // 1..56, unique, drives ordering and URL
  title: string,
  unit: number,              // 0..8
  duration: number,          // minutes, default 50
  goal: string,              // ONE sentence. What they can do afterwards.
  status: 'stub' | 'draft' | 'ready' | 'taught',
  props: string[],           // physical objects to gather. Feeds /materials/
  prep: string[],            // things to do before the session
  vocab: string[],           // new terms. Must exist in glossary/terms.yaml
  homework?: string,
  callsBackTo: number[],     // earlier lessons this depends on
  setsUp: number[],          // later lessons that depend on this
  applets: string[],         // custom element tag names used
  unplugged: boolean,        // true = Pi 400s stay closed
  extraProblems?: string[],  // rendered in the guide only
  pitfalls?: string[],       // "where this can go wrong", guide only
}
```

`callsBackTo` / `setsUp` are not decoration. The curriculum is deliberately a spiral — Unit 4's memory hierarchy is meaningless without Unit 0's block diagram, and Unit 3's hex pays off a promise made in Unit 2. Render these as real links in both deck and guide: a small "← builds on Lesson 2" chip in the deck footer, and a "Threads" panel in the guide. Validate at build time that every referenced lesson exists and that the relation is symmetric (if 31 `callsBackTo` 1, then 1 `setsUp` 31). Fail the build if not — this catches curriculum drift.

---

## 6. Authoring format

One `.mdx` file per lesson. Frontmatter, then an ordered sequence of `<Slide>` components. Never use `---` as a slide separator; it collides with Markdown horizontal rules.

```mdx
---
n: 1
title: What Is a Computer?
unit: 0
goal: Point at any object and say whether it is a computer, and name its inputs, outputs, and storage.
unplugged: true
props: [ "8-12 household objects", "towel", "sticky notes", "4 wall sheets" ]
vocab: [ input, process, output, storage, general-purpose, special-purpose ]
callsBackTo: []
setsUp: [2, 31, 32]
applets: [ four-box-sorter ]
---

import { Slide, Notes, Beat } from '@components/deck'
import FourBox from '@components/slides/FourBox.astro'

<Slide layout="title" n={1}>
  # What is a computer?
  <Notes>
    Ask it cold. Do not teach anything yet. Let them answer first.
  </Notes>
</Slide>

<Slide layout="two-col">
  ## The four boxes
  <FourBox annotate />
  <Notes>
    Draw this live on paper rather than showing it finished.
  </Notes>
</Slide>
```

**Rules for the author (and for you when generating):**

- The visible text of a slide is a headline plus at most one short supporting line. Everything else goes in `<Notes>`.
- `<Notes>` is stripped from the deck DOM entirely at build time except in presenter view. Do not render it hidden with CSS; a curious 9-year-old will find it with devtools, and that is a *good* thing to happen in Unit 5, not Unit 0.
- `<Beat>` marks an incremental reveal inside a slide. Advancing the deck reveals the next `<Beat>` before moving to the next slide.

---

## 7. The deck engine

This is the piece to get right first. Everything else is content.

### 7.1 Geometry

A slide is a **fixed 1280×720 design canvas** that is scaled to fit the viewport with a CSS transform. Not a fluid layout with clamp() typography — a real canvas. This is what makes it feel like slides rather than a webpage, and it means the parent authoring a slide knows exactly what will fit.

```
scale = min(viewportW / 1280, viewportH / 720)
transform: scale(var(--deck-scale));
transform-origin: center center;
```

Recompute on a `ResizeObserver`, write the result to a CSS custom property on the deck root, and never touch layout inside the slide. Letterbox the leftover space with the page background.

Consequences you must respect:
- All sizes inside a slide are in `px` against the 1280×720 canvas. No `vw`, no `vh`, no `rem` scaling tricks inside a slide.
- Never nest a scroll container inside a slide. If content overflows 720px, the slide is wrong — split it.
- Add a dev-mode overflow detector: in `import.meta.env.DEV`, outline any slide whose content exceeds the canvas in `var(--warn)` and log the slide index. This will save hours.

### 7.2 Modes

| Mode | Behaviour | Trigger |
|---|---|---|
| `present` | One slide filling the viewport, keyboard nav, letterboxed | default on ≥1024px |
| `read` | Slides stacked vertically, scroll, still 16:9 cards but flowing | `P`, or default on <1024px |
| `overview` | Grid of thumbnails, click to jump | `O` |
| `print` | One slide per landscape page, notes beneath | print stylesheet |

Read mode exists because the parent will review a deck on a phone. Do not skip it. In read mode the scaling transform still applies but the container is width-constrained rather than viewport-constrained.

### 7.3 Navigation

| Key | Action |
|---|---|
| `→` `↓` `Space` `PageDown` | next beat, else next slide |
| `←` `↑` `PageUp` | previous |
| `Home` / `End` | first / last slide |
| `F` | fullscreen |
| `O` | overview grid |
| `P` | toggle present/read |
| `S` | open presenter window |
| `B` | blackout screen (attention reset — you will use this constantly with a 7-year-old) |
| `?` | key help overlay |

Also: click/tap right third of screen = next, left third = previous, middle third = nothing (so applets are clickable). Swipe on touch. URL hash tracks slide index (`/lessons/01/#7`) so a slide is linkable and a refresh doesn't lose your place.

Progress indicator: a thin rail, not a numeric bar. See section 8.5.

### 7.4 Presenter view

`S` opens a second window at `/lessons/01/?presenter=1`. It shows: current slide thumbnail, next slide thumbnail, the `<Notes>` for the current slide, elapsed timer, and the lesson's timing plan. Sync the two windows with `BroadcastChannel('deck')`. Fall back to `localStorage` `storage` events if BroadcastChannel is unavailable. This works well when the parent has a laptop and the kids are on the Pis mirroring a shared display.

### 7.5 Applet slides

A slide may contain a single applet as its main content. Applets get keyboard focus only when the user tabs into them; while an applet has focus, the deck's arrow-key nav is suspended so arrow keys can drive the applet. Show a small `esc to leave` affordance. This detail matters — half the applets in section 12 want arrow keys.

---

## 8. Design system

### 8.1 Direction

The visual world is **the printed manual that came in the box** — technical documentation, silkscreen legends, engineering graph paper, ribbon cable, resistor color bands — but warm and oversized for children. Not "classroom." Not "kids' app." Not cream-and-serif. The register is: *this is real equipment and you are being trusted with it.*

The single risk being taken, and the thing the site is remembered by, is the **unit spine** described in 8.5.

### 8.2 Color

Base tokens:

```css
--paper:      #EDF0F3;   /* cool light ground, faintly blue */
--paper-2:    #E2E7EC;   /* card / recessed */
--grid:       #D3DAE1;   /* graph rule, 1px */
--ink:        #12171C;   /* near-black, blue cast */
--ink-2:      #444F59;   /* secondary text */
--ink-3:      #7A868F;   /* captions, slide numbers */
--warn:       #C2410C;   /* dev overflow, error states only */
--focus:      #0B63CE;   /* focus ring, links */
```

Dark mode: not now. Add `TODO(human)` and move on. The lessons happen in a lit room.

### 8.3 Unit palette — the resistor color code

There are nine units, numbered 0–8. Map each to its resistor band color. This is not a cute flourish: it is a real artifact from the subject's own world, it is legible at a glance, and it becomes teachable material later. Values are adjusted for contrast on `--paper` while staying recognizable.

```css
--u0: #2B2B2B;  /* 0 black   — What Is This Thing? */
--u1: #6B4423;  /* 1 brown   — Driving the Machine */
--u2: #B4232A;  /* 2 red     — Making Things */
--u3: #C2610C;  /* 3 orange  — Everything Is Numbers */
--u4: #9A7B0A;  /* 4 yellow  — Fast, Slow, and Forever */
--u5: #1F7A3D;  /* 5 green   — The Command Line */
--u6: #1B5EA8;  /* 6 blue    — The Internet */
--u7: #6B3FA0;  /* 7 violet  — Making the Machine Do Something */
--u8: #5B6670;  /* 8 grey    — Capstone */
```

Set `--accent` on the deck root from the lesson's unit and reference `--accent` everywhere downstream. Never hardcode a unit color in a component.

### 8.4 Typography

Four faces, each with a job. Self-host as subset woff2 in `public/fonts/`; no Google Fonts CDN, because the site must work offline.

| Role | Face | Use |
|---|---|---|
| Display | **Archivo** (variable, weight 700–800, width 100–110) | Slide headlines, page titles |
| Slide body | **Atkinson Hyperlegible Next** | All body text on slides |
| Guide prose | **Literata** | Teacher guide, unit intros, long reading |
| Utility | **IBM Plex Mono** | Slide numbers, eyebrows, labels, code, data |
| Annotation | **Caveat** | *Only* handwritten-looking annotations on diagrams. Nowhere else. |

Atkinson on slides is a deliberate choice over a neutral grotesque: it was designed for low-vision legibility, its disambiguated letterforms help a 7-year-old who is still decoding, and it has more character than Inter. Literata for the guide because that document is read as continuous prose at arm's length, which is a different problem.

Slide type scale, in canvas px (1280×720):

```
display-xl   112 / 0.95 / -0.02em   title slides only
display-l     80 / 1.00 / -0.015em  standard headline
display-m     56 / 1.05             section headline
body-l        38 / 1.35             the default slide body size
body-m        30 / 1.4              tables, dense lists
label         20 / 1.2  / 0.08em uppercase, mono
```

**Nothing on a slide is smaller than 24px on the canvas.** Enforce this in `scripts/check-content.mjs`. Guide pages use a normal responsive scale with a 68ch measure.

### 8.5 Signature: the unit spine

Every slide carries a **ribbon-cable rail** down its left edge: a 28px-wide column of nine 2px horizontal stripes at the top, one per unit, in the resistor colors above. The stripe for the current unit is full-opacity and 4px; the others are 15% opacity. Below the stripes, the rail runs as a single hairline in `--accent` whose fill height encodes progress through the lesson.

So at a glance, from across the room: which unit we're in (color), how far into the course (position of the lit stripe), how far into today (fill). It is the table of contents, the progress bar, and the unit identity in one 28px column, and it is drawn from the ribbon cable that connects the parts of the machine the course is about.

Do not add a second progress indicator anywhere. The rail is it.

### 8.6 Other surface rules

- Graph-paper ground (`--grid`, 24px squares, 1px) appears **only** on slides with `layout="activity"` or `layout="notebook"` — the ones where the kids are about to draw or move. It signals "you are doing something now."
- Border radius: 2px on cards, 0 elsewhere. This is equipment, not a toy.
- One elevation. Cards are distinguished by `--paper-2` fill and a 1px `--grid` border, not shadow.
- Slide number, bottom right, mono, as `03 / 15` in `--ink-3`.
- Eyebrow, top left inside the rail margin, mono uppercase: `UNIT 3 · EVERYTHING IS NUMBERS`.

### 8.7 Motion

One orchestrated moment, nothing ambient. Slide transitions: 160ms opacity + 8px translate on the content block only, never the rail. `<Beat>` reveals: 120ms fade-up. Applets may animate as their pedagogy requires (a packet moving through a router *should* move). Everything respects `prefers-reduced-motion: reduce` by dropping to instant.

No parallax. No scroll-jacking beyond the deck's own paging. No decorative background animation — it competes with the teacher for a seven-year-old's attention, which is the one resource the whole project runs on.

---

## 9. Slide layout components

`src/components/slides/`. Each takes the slide's children and arranges them on the 1280×720 canvas. Padding: 96px top/bottom, 96px right, 124px left (rail + gutter).

| Component | Shape | Use |
|---|---|---|
| `TitleSlide` | Centred display-xl, unit eyebrow, no number | Lesson opener |
| `BigQuestion` | Single question, display-l, upper third, huge whitespace | Ask-and-wait moments |
| `Statement` | One line, display-m, left-aligned, accent underline | The point of a section |
| `TwoCol` | 50/50 or 60/40, `split` prop | Text + diagram |
| `FullBleed` | Edge-to-edge image, caption overlay bottom-left on a scrim | Photos: ENIAC, punch card, tower interior |
| `Compare` | Two panels with a hairline between, labels above | This vs that. Storage vs memory. Bold vs heading. |
| `Steps` | Numbered rail of 2–5 items, one revealed per `<Beat>` | Sequences only. Not lists pretending to be sequences. |
| `TableSlide` | Mono headers, max 6 rows visible; overflow splits to a second slide | The "is it a computer?" table |
| `Activity` | Graph-paper ground, task in display-m, materials chip row, optional timer | "Now do this" |
| `Notebook` | Graph paper, a drawn box representing the page, the prompt beside it | "Draw this in your notebook" |
| `AppletSlide` | Applet fills the canvas below a short headline | Interactive demos |
| `Callback` | Ghosted thumbnail of the earlier slide + the new claim | Spiral moments: "remember the four boxes?" |
| `Closer` | The one sentence to remember, display-l, accent rail flush | Last slide of each lesson |

`Callback` deserves a note: the spiral only works if the callbacks are *visible*. When Lesson 31 says "the filing cabinet is storage," the actual Lesson 1 four-box diagram should appear ghosted behind it. Build `Callback` to accept a lesson number and slide index and render a real thumbnail of that slide, not a re-drawing.

---

## 10. Pages and routes

| Route | Contents |
|---|---|
| `/` | What this is, who it's for, where to start, the nine units as a spine diagram. Written for a stranger who found the repo, not for the family. |
| `/curriculum/` | All 56 lessons, grouped by unit, with goal lines and status. The spine, rendered large. Filterable by status. |
| `/units/[n]/` | Unit intro prose, its lessons, its vocabulary, its applets, the arc of what changes between the first and last lesson. |
| `/lessons/[nn]/` | The deck. |
| `/lessons/[nn]/guide/` | Teacher guide: goal, prep, props, timing plan, per-slide notes, extra problems, pitfalls, threads (callsBackTo/setsUp), homework. Print-friendly. |
| `/materials/` | **Generated** from every lesson's `props` and `prep`. Grouped by "have already / buy / scrounge", each linked to the lessons needing it, sorted by lesson number so lead-time is obvious. |
| `/glossary/` | Every term from every lesson's `vocab`, with the kid-facing definition, the lesson it appears in, and a link to that slide. |
| `/applets/` | Every applet standalone, playable outside its lesson. The kids will come back to these on their own; that is the point. |

`/materials/` and `/glossary/` must be generated, never hand-maintained. If a lesson lists a prop, it appears on the materials page. That is the only way the list stays true across 56 lessons.

---

## 11. The applet contract

Applets are **vanilla custom elements**. No framework, no build-time magic, one file each, `src/components/applets/<tag-name>.js` plus a co-located `.css` or a `<style>` in the shadow root.

Rules, all of them non-negotiable:

1. **Tag names are two words, hyphenated, descriptive:** `binary-counter`, `pixel-canvas`, `hex-mixer`. Registered once, idempotent.
2. **No dependencies.** No npm packages at runtime. If it needs a chart, draw the SVG.
3. **Self-contained.** Works when dropped on any page, including `/applets/`, with no surrounding markup.
4. **Configured by attributes**, with sensible defaults: `<pixel-canvas width="16" height="16" palette="mono">`.
5. **Reset button, always.** Children break things immediately and must be able to undo without a page reload.
6. **Keyboard accessible.** Tab to focus, arrows to operate, visible focus ring in `--focus`.
7. **Uses the tokens.** Never hardcodes a color. Inherits `--accent` from the deck.
8. **No score, no timer-pressure, no failure state, no sound by default.** Exception: the reaction-timer and the sound applets, which are about exactly those things.
9. **Under 15 KB** of JS each, uncompressed.
10. **Degrades:** wrapped in `<noscript>` with a static image and one sentence saying what it would have done.
11. **State is ephemeral** unless the applet is one where saving is the point (pixel art, the terminal sandbox's filesystem). Then `localStorage`, namespaced `cc:<tag>:<key>`, with a visible clear control.

Every applet must answer, in a comment at the top of its file: *what misconception does this fix?* If it doesn't fix one, it's decoration — cut it.

---

## 12. Applet catalog

Build these as the lessons need them, not up front. Starred ones are the load-bearing ones — build those well and the rest can be simple.

**Unit 0 — What Is This Thing?**
- `four-box-sorter` — drag objects into INPUT/PROCESS/OUTPUT/STORAGE. Objects from Lesson 1's table. *(L1)*
- `computer-or-not` — object appears, two buttons, then the explanation. No score. *(L1)*
- `block-diagram` ★ — the five-box computer, hover a box to see what it does and what happens without it. Reused in L2, L31, L32. Build it properly; it recurs more than anything else in the course. *(L2)*
- `port-match` — drag cable ends to ports on a photo of the Pi 400's back. *(L3)*
- `spec-decoder` — paste or pick a real machine listing; each spec line expands into "what this number means" and "does it matter for: homework / games / video / front desk". *(L5)*
- `parts-picker` ★ — $700 budget, pick parts for a stated use case, live total, compatibility warnings in plain language ("that power supply is too small for that graphics card"). The lesson-6 game. *(L6)*

**Unit 1 — Driving the Machine**
- `file-tree` ★ — a fake filesystem you can expand, create in, move things around. Same data later drives the terminal sandbox in Unit 5, which is the whole point: the map is the same map. *(L10, L11, L13)*
- `copy-vs-move` — two folders, one file, watch what each operation does. *(L11)*
- `extension-truth` — an icon and a filename; rename the extension and watch the icon change while the file's actual contents stay put. *(L12)*
- `error-message` — a realistic error dialog; click the parts to learn to read it. *(L14)*

**Unit 2 — Making Things**
- `structure-vs-style` ★ — the same document twice, one with bold-big-text, one with real headings. Press a button: generate a table of contents. Only one of them works. This single applet teaches the lesson better than any explanation. *(L16, L17)*
- `fill-down` — a small grid with a formula; drag the handle; watch references update. *(L20)*
- `chart-lies` — same dataset, four chart types, one truncated axis. Which one tells the truth? *(L21)*

**Unit 3 — Everything Is Numbers**
- `bit-switches` ★ — eight togglable switches, live decimal readout, target-number challenge mode. *(L24)*
- `size-estimator` — drag files onto a drive; watch it fill. Real sizes for a text file, photo, song, movie. *(L25)*
- `pixel-canvas` ★ — paint a grid, live readout of dimensions × bit depth = file size in bytes. Export as PNG so their art is real. *(L26)*
- `zoom-to-pixels` — a real photo, zoom slider all the way to individual pixels with values. *(L26)*
- `hex-mixer` ★ — three sliders, live swatch, live `#RRGGBB`, live binary. Ties Unit 3 back to Unit 2's color pickers. *(L27)*
- `ascii-table` — type a message, see the bytes; type bytes, see the message. *(L28)*
- `caesar-wheel` — two concentric rings you can rotate. Encode, decode, and brute-force all 25 shifts. Reused in L73's security lesson. *(L28)*
- `rle-compressor` ★ — takes the output of `pixel-canvas` and run-length-encodes it in front of them, showing before/after byte counts. The two applets must share a format. *(L29)*
- `lossy-slider` — JPEG quality 100 → 5 on a real image, with file size. Same for audio bitrate if feasible. *(L29)*

**Unit 4 — Fast, Slow, and Forever**
- `memory-pyramid` ★ — the hierarchy, with each level's latency **scaled to human time**: register = 1 second, cache = 10 seconds, RAM = 6 minutes, SSD = 3 days, spinning disk = 6 months, network = 4 years. This is the single best applet in the course. Make it beautiful. *(L32)*
- `volatile-demo` — type into a box, hit "power cut," watch RAM contents vanish and disk contents survive. *(L31)*
- `bottleneck-sim` — four resource meters and a set of scenarios; which one is pegged, and what does the machine feel like? *(L33)*
- `media-timeline` ★ — punch card → floppy → CD → flash → SSD, with capacity and cost-per-megabyte on a log axis over 70 years. Hover for the physical mechanism. *(L34)*
- `size-of-computers` — same-scale silhouettes: ENIAC, a mainframe, a PDP-11, an IBM PC, a laptop, a phone, a smartwatch, a microcontroller. Slider by year. *(L35)*

**Unit 5 — The Command Line**
- `terminal-sandbox` ★★ — a real-feeling shell over the *same virtual filesystem as `file-tree`*. Supports `pwd ls cd mkdir cp mv rm cat less grep sort wc du df` plus pipes and `>`. Safe: `rm -rf /` is allowed and gives them the horror and then a reset button. This is the most valuable applet in the whole site and the one worth the most effort. *(L38–L42)*

**Unit 6 — The Internet**
- `url-anatomy` ★ — type any URL, see it dissected into scheme / subdomain / domain / path / query, with the "which part is the real site?" quiz built on lookalike domains. Feeds directly into L47's phishing work. *(L43, L47)*
- `packet-journey` — a message cut into packets, routed, one dropped, retransmitted. Speed control. *(L44)*
- `search-refiner` — a query box that shows how quotes, minus, and `site:` change a mock result set. *(L45)*
- `phish-or-not` ★ — realistic emails and login pages; click the tell. Explains every one, whether right or wrong. *(L47)*
- `password-strength` — shows the search space, not a colored bar. "This many guesses" vs "this long to crack." Then a passphrase, for contrast. *(L47)*

**Unit 7 — Making the Machine Do Something**
- Scratch is embedded/linked, not rebuilt. *(L49, L50)*
- `python-trace` — a few lines of Python with a variables panel; step through one line at a time and watch the boxes change. Not an interpreter — a hand-authored trace per example. Cheap to build, teaches the thing that actually confuses beginners. *(L51–L53)*
- `gpio-sim` — a breadboard with an LED; run the blink code, watch it blink. Insurance for when the real hardware doesn't cooperate. *(L54)*

---

## 13. Quality floor

- Every page: keyboard navigable, visible focus, landmark regions, one `h1`.
- Decks: each slide is a `<section aria-label>`. Announce slide changes to screen readers politely.
- Contrast: 4.5:1 minimum for everything, including on the graph-paper ground. Check the yellow unit color specifically.
- Images: real `alt` text written as a description of what the picture teaches, not "photo of ENIAC."
- `prefers-reduced-motion` honored everywhere.
- Lighthouse ≥ 95 across the board on a throttled mid-tier device profile.
- Service worker precaches the shell, the current unit's lessons, and all fonts. Show a small "available offline" indicator once cached, because the parent needs to know before the lesson starts, not during.

---

## 14. Deployment

GitHub Pages, project site. **The base path is the classic failure here** — a project page serves from `/<repo>/`, so:

```js
// astro.config.mjs
export default defineConfig({
  site: 'https://<user>.github.io',
  base: '/<repo>/',
  output: 'static',
  integrations: [mdx(), sitemap()],
})
```

Every internal link must go through `import.meta.env.BASE_URL` or a `href()` helper. Do not write bare `/lessons/01/` anywhere. Write the helper first and lint for raw absolute internal hrefs in `check-content.mjs`; this will otherwise break exactly once, in production, five minutes before a lesson.

`.github/workflows/deploy.yml`: standard `actions/checkout` → `setup-node@20` → `npm ci` → `npm run build` → `actions/upload-pages-artifact` → `actions/deploy-pages`, on push to `main`. Add `npm run check` (content lint + link check) as a required step before build so a broken cross-reference fails loudly.

Custom domain: leave a `TODO(human)` and a commented `public/CNAME`.

---

## 15. Build phases

Do these in order. Each has an acceptance test. Do not begin the next phase until the current one passes.

### 15.0 `CLAUDE.md` to write into the repo root

```md
# Conventions

- Astro 5, static, MDX lessons. No React/Vue/Svelte. No Tailwind. No CSS framework.
- Applets are vanilla custom elements in src/components/applets/, no runtime deps, <15KB each.
- All color and type come from src/styles/tokens.css. Never hardcode a hex value in a component.
- Slides are a fixed 1280x720 canvas scaled by transform. Inside a slide, sizes are px. Never vw/vh/rem.
- Nothing on a slide is smaller than 24px canvas. Nothing on a slide is longer than ~40 words.
- Teacher prose lives in <Notes> and frontmatter, never on a slide.
- Internal links go through the href() helper so the GitHub Pages base path works.
- Run `npm run check` before committing. It lints content rules and cross-references.
- Curriculum content is the human's. If pedagogy is unclear, leave TODO(human): and ask.
- Target device is a Raspberry Pi 400 in Chromium. Budget <200KB JS per lesson page.
```

**Phase 1 — Scaffold.** Astro project, base path config, tokens.css with every token from section 8, fonts self-hosted and subset, `href()` helper, deploy workflow, a hello-world page live on GitHub Pages.
*Accept:* the URL loads from `github.io/<repo>/` with correct fonts and no 404s on assets.

**Phase 2 — Deck engine.** `Deck`, `Slide`, `Notes`, `Beat`, scaling, all four modes, all keybindings, hash routing, presenter window, the unit spine, dev overflow detector. Test with a throwaway 8-slide deck exercising every layout in section 9.
*Accept:* works in Chromium on a Pi 400 at 1080p and on a phone; presenter window stays in sync; `B` blanks; printing produces one landscape slide per page.

**Phase 3 — Design system in the flesh.** Build all layout components from section 9 against the throwaway deck. Screenshot each. Critique against section 8 and fix.
*Accept:* a stranger seeing one slide can name the unit from the rail alone.

**Phase 4 — Content pipeline.** Content collection schema, `curriculum.yaml` in place, `scaffold-lessons.mjs` generating 56 stub `.mdx` files with correct frontmatter and a single placeholder title slide, `check-content.mjs` enforcing section 16's rules and the symmetry of `callsBackTo`/`setsUp`.
*Accept:* `npm run check` passes with 56 stubs; `/curriculum/` renders the whole course; `/materials/` and `/glossary/` generate from frontmatter.

**Phase 5 — Lesson 1, fully.** Build it from section 18 exactly, including `four-box-sorter` and `computer-or-not`. This is the template every other lesson is measured against.
*Accept:* the parent can teach the whole lesson from the deck and guide without any other document.

**Phase 6 — Unit 0 complete.** Lessons 2–6 and their applets, `block-diagram` and `parts-picker` built properly.
*Accept:* six lessons deliverable end to end.

**Phase 7 — Applet infrastructure.** `/applets/` index page, the standalone wrapper, the `<noscript>` fallback pattern, the shared virtual filesystem module that `file-tree` and `terminal-sandbox` both consume.
*Accept:* every applet is playable standalone and works offline.

**Phase 8 onward — Units 1–8**, one unit per pass, content and applets together. Stop after each unit and let the human teach it before building the next; the curriculum will change based on what actually happens in the room, and building 50 lessons ahead of the classroom guarantees rework.

---

## 16. Content conventions

Enforce mechanically in `check-content.mjs` where possible; the rest are for whoever is writing.

1. **One idea per slide.** If the headline needs an "and," it's two slides.
2. **Max ~40 words visible per slide.** Warn above 40, error above 60.
3. **Headline is a claim or a question, never a label.** "Most computers don't look like computers," not "Types of computers."
4. **No bullet list longer than 4 items** on a slide. Longer lists become a `TableSlide` or successive `<Beat>`s.
5. **Second person, present tense, active voice.** "You press the button once and walk away. Ten seconds later it still knows."
6. **Define a term the first time it appears** and add it to `vocab`. Lint: any term in `vocab` must exist in the glossary; any bolded term on a slide should probably be in `vocab`.
7. **Every lesson ends with a `Closer`** — one sentence, the thing to remember.
8. **Every lesson opens with something that isn't you talking.** A question, an object, a challenge from last time.
9. **Ask before telling.** If a slide states a fact the kids could have guessed at, the slide before it should ask them to guess.
10. **No jargon on a slide before it is earned.** "Volatile" is fine in Lesson 31 only after the plug-pull demo, never before.
11. Prefer real numbers and real objects over abstractions. "How many megabytes is that song" beats "files have sizes."
12. American English, sentence case for headlines, no terminal periods on headlines under eight words.

---

## 17. The curriculum

Save verbatim as `src/content/curriculum.yaml`. `scripts/scaffold-lessons.mjs` reads this and emits one stub `.mdx` per lesson. `goal` is the acceptance test for the lesson, phrased as what the child can do afterwards.

```yaml
course:
  title: Computers
  subtitle: A course for two kids
  lessons: 56
  session: 50            # minutes
  cadence: "1-2 per week"
  thesis: >
    A competent adult should be able to buy a computer, drive it, make documents
    with it, understand why it is slow, not lose their files, not get scammed,
    and not be afraid of it.

units:
  - n: 0
    title: What Is This Thing?
    color: black
    arc: >
      Begins with "a computer is the thing on the desk" and ends with them
      speccing and pricing a machine for a stated job.
  - n: 1
    title: Driving the Machine
    color: brown
    arc: >
      From "where did my download go" to a filing system they designed and a
      repeatable procedure for when something breaks.
  - n: 2
    title: Making Things
    color: red
    arc: >
      The three office tools, each attached to something they chose. Ends with
      a real talk given to a real audience.
  - n: 3
    title: Everything Is Numbers
    color: orange
    arc: >
      Every file they have made so far, re-explained as numbers. Ends with them
      compressing their own artwork by hand.
  - n: 4
    title: Fast, Slow, and Forever
    color: yellow
    arc: >
      The mental model most adults never acquire. Ends with them diagnosing a
      slow machine and restoring a file they deleted on purpose.
  - n: 5
    title: The Command Line
    color: green
    arc: >
      The same filesystem from Unit 1, now in text. Ends with a script that
      does something they actually want done.
  - n: 6
    title: The Internet
    color: blue
    arc: >
      From "the internet is magic" to tracing a packet, reading a URL, and
      spotting a phish.
  - n: 7
    title: Making the Machine Do Something
    color: violet
    arc: >
      Enough programming to demystify it and to make Unit 3 concrete. Ends with
      code that moves atoms.
  - n: 8
    title: Capstone
    color: grey
    arc: Something real, built and documented and demoed.

lessons:

  # ---------- Unit 0: What Is This Thing? ----------
  - n: 1
    unit: 0
    title: What Is a Computer?
    goal: Point at any object and say whether it is a computer, naming its input, output, and storage.
    unplugged: true
    vocab: [input, process, output, storage, general-purpose, special-purpose]
    props: ["8-12 household objects", towel, "sticky notes", "4 wall sheets", notebooks]
    applets: [four-box-sorter, computer-or-not]
    setsUp: [2, 31, 32, 35]
    homework: Computer hunt. One point per computer nobody named, defended by input, output, and storage.

  - n: 2
    unit: 0
    title: The Five Boxes
    goal: Draw the block diagram of any computer and point to each part on a real Pi 400.
    vocab: [CPU, RAM, storage, motherboard, peripheral, port]
    props: ["Pi 400", "SD card", "power supply", "HDMI cable"]
    applets: [block-diagram]
    callsBackTo: [1]
    setsUp: [4, 5, 31]
    prep: ["Have a spare SD card they can hold"]

  - n: 3
    unit: 0
    title: The Peripheral Zoo
    goal: Name every common port and cable and match them by sight.
    vocab: [USB, HDMI, ethernet, peripheral, adapter]
    props: ["a box of assorted cables", "mouse", "webcam", "USB stick", "old printer cable"]
    applets: [port-match]
    callsBackTo: [2]
    homework: Find the weirdest port in the house and photograph it.

  - n: 4
    unit: 0
    title: Inside the Tower
    goal: Identify PSU, motherboard, CPU, RAM, drive, and GPU in a real machine.
    unplugged: true
    vocab: [power supply, heatsink, GPU, expansion slot, SATA]
    props: ["a donor desktop tower", screwdriver, "anti-static wrist strap", "a stick of RAM they can hold"]
    prep: ["Source a dead tower well in advance - freecycle, work e-waste, a friend's garage", "Confirm it is unplugged and the PSU is discharged"]
    callsBackTo: [2]
    setsUp: [5, 6]
    pitfalls: ["Do not let this become a lecture on part numbers. One sentence per part."]

  - n: 5
    unit: 0
    title: Reading a Spec Sheet
    goal: Read a real computer listing and say which numbers matter for a stated job.
    vocab: [gigahertz, core, gigabyte, terabyte, integrated graphics]
    props: ["three printed machine listings at different price points"]
    applets: [spec-decoder]
    callsBackTo: [2, 4]
    setsUp: [6, 32, 33]

  - n: 6
    unit: 0
    title: Build a Computer
    goal: Spend a fixed budget on parts for a stated use case and defend every choice.
    vocab: [compatibility, bottleneck, budget]
    applets: [parts-picker]
    callsBackTo: [4, 5]
    homework: Spec a machine for a family member and ask them if you got it right.

  # ---------- Unit 1: Driving the Machine ----------
  - n: 7
    unit: 1
    title: What an Operating System Is
    goal: Explain what sits between you and the hardware, and shut down properly without being told.
    vocab: [operating system, desktop, window, taskbar, application]
    callsBackTo: [2]
    setsUp: [38]

  - n: 8
    unit: 1
    title: Typing Bootcamp
    goal: Find the home row without looking, and start a daily habit.
    vocab: [home row, modifier key, shortcut]
    prep: ["Install a typing tutor on both Pis", "Decide the daily time and make it non-negotiable"]
    homework: Ten minutes a day, every day, for the rest of the course.
    pitfalls: ["This is the rate limiter on Units 2, 5 and 7. It cannot be compressed, only accumulated. Do not let it slide."]
    setsUp: [15, 38, 51]

  - n: 9
    unit: 1
    title: Right-Click and Other Powers
    goal: Use right-click, drag, and text selection deliberately rather than by accident.
    vocab: [context menu, drag, double-click, select]
    setsUp: [11]

  - n: 10
    unit: 1
    title: The File System
    goal: Walk the folder tree and say where they are without looking at the address bar.
    vocab: [folder, directory, path, home, tree]
    applets: [file-tree]
    callsBackTo: [2]
    setsUp: [11, 13, 38]

  - n: 11
    unit: 1
    title: Copy, Move, Delete
    goal: Explain the difference between copying and moving, and find a downloaded file.
    vocab: [copy, move, trash, downloads]
    applets: [copy-vs-move, file-tree]
    callsBackTo: [10]
    pitfalls: ["Where downloads go is the single most common adult confusion. Spend real time here."]

  - n: 12
    unit: 1
    title: Icons Lie, Extensions Tell the Truth
    goal: Predict what will open a file from its extension, not its icon.
    vocab: [extension, file type, open with]
    applets: [extension-truth]
    setsUp: [30]

  - n: 13
    unit: 1
    title: Naming and Organizing
    goal: Design and build a folder scheme for their own stuff, and say when to search vs browse.
    vocab: [naming convention, search, sort by date]
    applets: [file-tree]
    callsBackTo: [10, 11]
    homework: Organize one real messy folder and show it next time.

  - n: 14
    unit: 1
    title: It's Broken - Now What?
    goal: Run the troubleshooting procedure on an unfamiliar failure without panicking.
    vocab: [error message, restart, reproduce, one change at a time]
    applets: [error-message]
    prep: ["Break something on each Pi in advance. Unplug the mouse, rename a file, disconnect wifi."]
    setsUp: [33, 49]
    pitfalls: ["Arguably the highest-value hour in the course. Do not rush it because it has no new software in it."]

  # ---------- Unit 2: Making Things ----------
  - n: 15
    unit: 2
    title: Plain Text and Word Processors
    goal: Say what a word processor adds to plain text, and save vs save-as correctly.
    vocab: [plain text, word processor, save as, undo]
    callsBackTo: [8, 12]

  - n: 16
    unit: 2
    title: Headings Beat Bold
    goal: Format a document with real headings instead of making text big.
    vocab: [heading, style, structure, appearance]
    applets: [structure-vs-style]
    setsUp: [17, 71]
    pitfalls: ["This is the one professional habit in the whole unit. Make them redo it if they fake headings."]

  - n: 17
    unit: 2
    title: Long Documents
    goal: Generate a table of contents, add page numbers, and find-and-replace across a document.
    vocab: [table of contents, page break, margin, find and replace]
    callsBackTo: [16]

  - n: 18
    unit: 2
    title: "Project: The Report"
    goal: Produce a two-page illustrated report with title page, contents, headings, and page numbers.
    vocab: []
    callsBackTo: [16, 17]
    setsUp: [23, 41]
    homework: Finish it. It gets used again in Unit 5.

  - n: 19
    unit: 2
    title: Spreadsheets, Day One
    goal: Say what a spreadsheet is for and enter data into a grid without fighting it.
    vocab: [cell, row, column, grid reference]
    setsUp: [20, 74]

  - n: 20
    unit: 2
    title: The Equals Sign
    goal: Write a formula, use SUM and AVERAGE, and fill down.
    vocab: [formula, cell reference, SUM, AVERAGE, fill down]
    applets: [fill-down]
    callsBackTo: [19]

  - n: 21
    unit: 2
    title: Sort, Filter, Chart
    goal: Build a tracker for something they care about and chart it honestly.
    vocab: [sort, filter, bar chart, line chart, axis]
    applets: [chart-lies]
    callsBackTo: [20]
    homework: Keep the tracker updated for two weeks.

  - n: 22
    unit: 2
    title: Slides Support the Talker
    goal: Build a slide deck that helps them talk instead of replacing them.
    vocab: [slide, layout, speaker notes, presenter view]
    pitfalls: ["Ban reading slides aloud from the first minute. Six words a slide."]

  - n: 23
    unit: 2
    title: Present Day
    goal: Give a three-minute talk with slides, and move a chart between three applications.
    vocab: [copy and paste, PDF, export]
    props: ["an actual audience - siblings, grandparents, anyone"]
    callsBackTo: [18, 21, 22]
    setsUp: [30]

  # ---------- Unit 3: Everything Is Numbers ----------
  - n: 24
    unit: 3
    title: Base Ten Is a Choice
    goal: Count to 31 on their fingers in binary and explain why.
    unplugged: true
    vocab: [binary, bit, base, place value]
    props: ["flip cards with 1,2,4,8,16 dots"]
    applets: [bit-switches]
    setsUp: [25, 27, 28]

  - n: 25
    unit: 3
    title: Bits, Bytes, Gigabytes
    goal: Estimate how many photos or songs fit on a given drive.
    vocab: [byte, kilobyte, megabyte, gigabyte, terabyte]
    applets: [size-estimator]
    callsBackTo: [24]
    setsUp: [26, 29, 34, 40]

  - n: 26
    unit: 3
    title: Bitmaps
    goal: Compute the file size of a picture from its dimensions, with a pencil.
    vocab: [pixel, resolution, bitmap, bit depth]
    props: [graph paper, "colored pencils"]
    applets: [pixel-canvas, zoom-to-pixels]
    callsBackTo: [25]
    setsUp: [27, 29]

  - n: 27
    unit: 3
    title: Color Is Three Numbers
    goal: Predict a hex color code from an RGB mix, and read one in the wild.
    vocab: [RGB, hexadecimal, hex code, channel]
    applets: [hex-mixer]
    callsBackTo: [24, 26]

  - n: 28
    unit: 3
    title: Letters Are Numbers Too
    goal: Encode and decode a message by hand and explain why emoji needed a bigger scheme.
    unplugged: true
    vocab: [ASCII, Unicode, encoding, cipher]
    props: ["paper", "the Caesar wheel printout"]
    applets: [ascii-table, caesar-wheel]
    callsBackTo: [24]
    setsUp: [47]

  - n: 29
    unit: 3
    title: Making It Smaller
    goal: Compress their own pixel art by hand and say what lossy compression throws away.
    vocab: [compression, lossless, lossy, run-length encoding, zip]
    applets: [rle-compressor, lossy-slider]
    callsBackTo: [25, 26]

  - n: 30
    unit: 3
    title: Formats Are Containers
    goal: Choose the right format to send something, and say what a proprietary format costs you.
    vocab: [format, container, proprietary, open format]
    callsBackTo: [12, 23, 29]
    setsUp: [36]

  # ---------- Unit 4: Fast, Slow, and Forever ----------
  - n: 31
    unit: 4
    title: The Desk and the Filing Cabinet
    goal: Explain why unsaved work disappears when the power goes out.
    vocab: [memory, storage, volatile, save]
    props: ["a power strip you are willing to switch off mid-sentence"]
    applets: [volatile-demo, block-diagram]
    callsBackTo: [1, 2, 5]
    setsUp: [32, 33, 36]

  - n: 32
    unit: 4
    title: The Speed Pyramid
    goal: Order the storage hierarchy by speed and say what cache is for.
    vocab: [cache, register, latency, hierarchy]
    applets: [memory-pyramid]
    callsBackTo: [1, 31]
    setsUp: [33]

  - n: 33
    unit: 4
    title: Why Is It Slow?
    goal: Open a task manager, find the bottleneck, and name it.
    vocab: [process, task manager, bottleneck, CPU load]
    applets: [bottleneck-sim]
    callsBackTo: [14, 32]
    prep: ["Arrange for something to actually be slow - a big file copy running, twenty tabs open"]

  - n: 34
    unit: 4
    title: Physical Media
    goal: Explain how three different media physically store a bit.
    unplugged: true
    vocab: [magnetic, optical, flash, platter, punch card]
    props: ["punch card", "floppy disk", "CD or DVD", "USB stick", "an opened hard drive", "SD card"]
    prep: ["Start scrounging these months early. eBay lots, older relatives, a repair shop's junk bin.", "Open a dead hard drive in advance - the platter and the magnet are the best props in the course"]
    applets: [media-timeline]
    callsBackTo: [25]
    setsUp: [35, 36]

  - n: 35
    unit: 4
    title: From a Room to Your Wrist
    goal: Put six generations of computer in order and say what got smaller and why it mattered.
    unplugged: true
    vocab: [mainframe, minicomputer, transistor, integrated circuit, Moore's law]
    applets: [size-of-computers]
    callsBackTo: [1, 34]

  - n: 36
    unit: 4
    title: How You Lose Everything
    goal: Set up a real backup and restore a file they deleted on purpose.
    vocab: [backup, restore, offsite, ransomware]
    props: ["an external drive or a second USB stick"]
    callsBackTo: [31, 34]
    setsUp: [37]
    homework: Check the backup ran. Then check it again next week.

  - n: 37
    unit: 4
    title: The Cloud Is Someone Else's Computer
    goal: Say the difference between sync, backup, and storage, and what happens offline.
    vocab: [cloud, sync, upload, download, server]
    callsBackTo: [36]
    setsUp: [44, 48]

  # ---------- Unit 5: The Command Line ----------
  - n: 38
    unit: 5
    title: Why a Terminal Exists
    goal: Navigate the filesystem in text and know where they are at all times.
    vocab: [terminal, shell, command, pwd, ls, cd]
    applets: [terminal-sandbox]
    callsBackTo: [10, 7]
    setsUp: [39, 40, 41, 42]

  - n: 39
    unit: 5
    title: Making and Breaking
    goal: Create, copy, move and delete from the command line, carefully.
    vocab: [mkdir, cp, mv, rm, wildcard, tab completion]
    applets: [terminal-sandbox]
    callsBackTo: [11, 38]
    pitfalls: ["Let them destroy the sandbox on purpose once. Fear of rm is learned best in a place where it is free."]

  - n: 40
    unit: 5
    title: Reading and Writing
    goal: Read a file, edit it, and check how much space things take.
    vocab: [cat, less, nano, du, df]
    applets: [terminal-sandbox]
    callsBackTo: [25, 39]

  - n: 41
    unit: 5
    title: Small Tools, Combined
    goal: Chain commands with a pipe to answer a question about their own file.
    vocab: [pipe, redirect, grep, sort, wc]
    applets: [terminal-sandbox]
    callsBackTo: [18, 40]
    prep: ["Have their lesson 18 report on the Pi as plain text"]

  - n: 42
    unit: 5
    title: Where Software Comes From
    goal: Write a small script, install something with a package manager, and say why not to run a random download.
    vocab: [script, package manager, repository, open source, update]
    callsBackTo: [41]
    setsUp: [47]

  # ---------- Unit 6: The Internet ----------
  - n: 43
    unit: 6
    title: Driving a Browser
    goal: Read a URL like a sentence and use tabs, history, and print-to-PDF deliberately.
    vocab: [browser, URL, domain, tab, bookmark, padlock]
    applets: [url-anatomy]
    callsBackTo: [30]
    setsUp: [45, 47]

  - n: 44
    unit: 6
    title: What Happens When You Press Enter
    goal: Trace the path from their keyboard to a server and back, out loud.
    vocab: [router, ISP, DNS, server, IP address, packet]
    applets: [packet-journey]
    callsBackTo: [37, 43]
    props: ["a paper note to cut into packets"]

  - n: 45
    unit: 6
    title: Searching, and Believing
    goal: Refine a search with operators and say who wrote a page and who paid for it.
    vocab: [query, operator, source, sponsored]
    applets: [search-refiner]
    callsBackTo: [43]
    setsUp: [46]

  - n: 46
    unit: 6
    title: Why It's Free
    goal: Explain how an ad-funded site makes money from their attention.
    vocab: [advertising, cookie, tracking, targeted]
    prep: ["Install a content blocker on one Pi only, so they can compare side by side"]
    callsBackTo: [45]

  - n: 47
    unit: 6
    title: Scams
    goal: Spot a phishing attempt and explain the house rule about codes and money.
    vocab: [phishing, two-factor, password manager, urgency]
    applets: [phish-or-not, password-strength, url-anatomy, caesar-wheel]
    callsBackTo: [28, 42, 43]
    pitfalls: ["Keep it concrete and calm. The goal is a procedure, not fear."]

  - n: 48
    unit: 6
    title: Email and Footprints
    goal: Send a proper email and say what is permanent and what is public.
    vocab: [cc, bcc, attachment, reply all, footprint]
    callsBackTo: [37, 30]

  # ---------- Unit 7: Making the Machine Do Something ----------
  - n: 49
    unit: 7
    title: Telling It Exactly
    goal: Build a program in Scratch with a loop that draws something.
    vocab: [program, loop, sprite, event, bug, debug]
    callsBackTo: [14]
    setsUp: [50]

  - n: 50
    unit: 7
    title: If, and Remembering
    goal: Use a conditional and a variable to make a small game with a score.
    vocab: [conditional, variable, condition, true, false]
    callsBackTo: [49]
    setsUp: [52]

  - n: 51
    unit: 7
    title: Python, in Words
    goal: Write and run a program that asks a question and uses the answer.
    vocab: [Python, print, input, string, run]
    applets: [python-trace]
    callsBackTo: [8, 50]

  - n: 52
    unit: 7
    title: Deciding and Repeating
    goal: Write a guessing game with hints that ends when it should.
    vocab: [if, else, while, loop, comparison]
    applets: [python-trace]
    callsBackTo: [50, 51]

  - n: 53
    unit: 7
    title: Doing It a Hundred Times
    goal: Write a script that does a boring job to a whole folder at once.
    vocab: [list, for, index, file, automation]
    applets: [python-trace]
    callsBackTo: [13, 41, 52]
    pitfalls: ["Pick a job they actually want done. Renaming their own photos beats any toy example."]

  - n: 54
    unit: 7
    title: Code That Moves Atoms
    goal: Blink an LED from a program, and change how it blinks.
    vocab: [GPIO, LED, resistor, circuit]
    props: ["breadboard", "jumper wires", "LEDs", "330 ohm resistors", "GPIO breakout ribbon for the Pi 400"]
    prep: ["Test the circuit yourself first. Nothing kills this lesson like debugging hardware live."]
    applets: [gpio-sim]
    callsBackTo: [52]
    setsUp: [55]

  # ---------- Unit 8: Capstone ----------
  - n: 55
    unit: 8
    title: Pitch and Build
    goal: Write a one-page spec for something real and start building it.
    vocab: [requirement, scope, specification]
    callsBackTo: [18, 21, 36, 53]

  - n: 56
    unit: 8
    title: Demo Night
    goal: Demonstrate a finished thing to an audience, with written instructions someone else could follow.
    props: ["an audience", "something to show it on"]
    callsBackTo: [23, 55]
```

---

## 18. Reference implementation: Lesson 1

This is the shape every other lesson copies. Build it exactly. Note how little text is on each slide and how much is in `<Notes>`.

**File:** `src/content/lessons/01-what-is-a-computer.mdx`

```mdx
---
n: 1
unit: 0
title: What Is a Computer?
duration: 50
goal: Point at any object and say whether it is a computer, naming its input, output, and storage.
status: ready
unplugged: true
vocab: [input, process, output, storage, general-purpose, special-purpose]
props:
  - "8-12 household objects (see the guide for the list)"
  - "a towel to cover them"
  - "sticky notes and a marker"
  - "4 sheets of paper labelled INPUT / PROCESS / OUTPUT / STORAGE, taped to the wall"
  - "one paper notebook per child"
prep:
  - "Gather the objects and hide them under the towel before they walk in."
  - "Tape the four wall sheets up in advance."
  - "Hand out the notebooks at the start of this session - the habit is easier to begin than to retrofit."
  - "Keep the Pi 400s closed and off, or on the floor. This lesson is unplugged and a keyboard within reach will lose them."
callsBackTo: []
setsUp: [2, 31, 32, 35]
applets: [four-box-sorter, computer-or-not]
homework: >
  Computer hunt. Find computers nobody named today. One point each, and the
  object must survive a challenge - you have to defend its input, its output,
  and where it keeps things. Bonus point for something that is arguably a
  computer, argued well, either way.
pitfalls:
  - >
    The temptation is to answer "what is a computer?" with everything you know -
    stored programs, Turing completeness, microcontrollers. Don't. Four boxes and
    a towel. Precision comes later; today's only job is to break the idea that
    computers are the desk-shaped things.
  - >
    When a kid asks something you can't answer crisply, say "good question, I'm
    not sure - maybe pile" and look it up together next time. Modelling that is
    worth more than having an answer ready, and it is the same posture as Lesson 14.
extraProblems:
  - "Name a computer with no screen. Then one with no buttons."
  - "A digital camera: name its input, output, and storage. What happens when the storage is full?"
  - "An elevator - computer or not? Defend it."
  - "What box is missing from a wind-up music box? (Process. It plays the same thing forever.)"
  - "Your school has a computer that helps decide grades. What are its inputs? Who chose them?"
---

import { Slide, Notes, Beat } from '@components/deck'
import FourBox from '@components/slides/FourBox.astro'

{/* ---------- Part 1: The Question (0:00-0:08) ---------- */}

<Slide layout="title">
  # What is a computer?
  <Notes>
    Ask it cold. Say nothing else. Let them answer before you teach anything.
    Two minutes of silence here is not wasted time.
  </Notes>
</Slide>

<Slide layout="activity">
  ## Your answers
  <p class="prompt">Say what you think. I'll write it down.</p>
  <Notes>
    Write each answer verbatim on its own sticky note and put them on the wall.
    Do not correct anything. You are coming back to this list on the last slide
    and letting them grade themselves, so capture it accurately.

    Expect: "it has a screen", "it has a keyboard", "it's for games", "it's smart".
  </Notes>
</Slide>

<Slide layout="full-bleed" image="/media/l01/eniac.jpg"
       alt="A room-sized 1940s computer with people walking between cabinets of wiring">
  ## Is this a computer?
  <Notes>
    It is. No screen, no keyboard, no mouse - a room you walk inside.

    So whatever a computer is, it is not "the thing that looks like the thing on
    my desk." Plant this confusion deliberately. You resolve it in Part 2.
  </Notes>
</Slide>

{/* ---------- Part 2: The Four Boxes (0:08-0:20) ---------- */}

<Slide layout="two-col" split="40/60">
  ## The four boxes
  <FourBox />
  <Notes>
    Draw this live on paper rather than showing it finished. Three boxes left to
    right with arrows, and STORAGE hanging below PROCESS with a two-way arrow.

    In kid words:
    - Input: how it finds things out
    - Process: where it decides what to do
    - Output: how it tells you, or changes something
    - Storage: where it keeps things when it isn't thinking about them
  </Notes>
</Slide>

<Slide layout="two-col" image="/media/l01/vending.jpg">
  ## A vending machine
  <Beat>Coins. A button.</Beat>
  <Beat>Did they pay enough? Is that slot empty?</Beat>
  <Beat>The snack drops. The change comes back.</Beat>
  <Beat>The snacks. The money it has counted.</Beat>
  <Notes>
    Do this one entirely yourself, out loud, so they hear the shape of a good answer.
    One beat per box, in order.
  </Notes>
</Slide>

<Slide layout="two-col" image="/media/l01/traffic-light.jpg">
  ## Now a traffic light
  <p class="prompt">You do this one.</p>
  <Notes>
    Ask, don't tell. They fill in the boxes.

    INPUT - they will say the pedestrian button. Then push: how does it know a
    car is waiting at 2am? A wire loop buried in the road senses the metal on top
    of it. You can see the rectangular seams cut in the asphalt. Also: a clock,
    sometimes a camera, sometimes a radio receiver so a fire truck can take over.

    PROCESS - decides who goes, based on what it sensed. Ask what rule it must
    never break. They will get "not both green," which is exactly right.

    OUTPUT - the lamps, the walk sign, the countdown, the ticking sound, the arrows.

    STORAGE - two very different things. (1) The timing plan, written down inside.
    (2) THE FACT THAT YOU PRESSED THE BUTTON. You press once and walk away and ten
    seconds later it still knows - and it shows you it knows, because the button
    lights up. That is a computer visibly holding on to something that happened.

    Closer: does it play games? Browse the web? No. One job, forever.
  </Notes>
</Slide>

<Slide layout="compare">
  ## A hammer is not a computer
  <Notes>
    Input: your arm. Output: a dent. No process - it cannot decide anything, and
    it does not remember. Same for a chair, a bicycle.

    Spend a beat on a book: pure storage. Real storage, holds information for
    centuries, still not a computer.

    Process is the box that decides. That is the load-bearing one.
  </Notes>
</Slide>

{/* ---------- Part 3: The Table Under the Towel (0:20-0:38) ---------- */}

<Slide layout="activity">
  ## Is it a computer?
  <p class="prompt">Call it. Then name one input and one output.</p>
  <Notes>
    Pull the towel off. One object at a time. Younger answers first on odd
    objects, older on even, so the 9-year-old doesn't get every first crack.

    EASY RUN: pocket calculator (yes - tiny one), book (no - storage only),
    wind-up kitchen timer (no - measures but never decides), microwave (yes),
    digital watch (yes - ask where its storage is: the time, and the alarm),
    flashlight (no - switch to light, no decision in between), thermostat
    (yes - and its input isn't a person, it's temperature), car (dozens of them).

    ARGUMENT PILE, save for last: the abacus (YOU are the processor - it is just
    storage) and the TV remote (its storage box is nearly empty and it is STILL a
    computer). Let them fight. The remote is the better lesson: process is the box
    that decides, the other three can be thin.

    If a kid asks what the remote stores: the list of codes. Every button has its
    own invisible blink pattern and that list has to be written down inside it.
    Prove it - a phone camera in selfie mode sees the infrared LED flash.

    If the 9-year-old objects that that isn't really remembering: they are right,
    and tell them so. Two kinds of storing - the remote stores HOW TO DO ITS JOB,
    the microwave also stores WHAT HAS HAPPENED. Proof: after a power cut the
    microwave blinks 12:00. It forgot. The remote never forgets its codes.
    (That's Lesson 31 arriving thirty lessons early. Bank it.)

    Finish with the light switch. Cleanest non-example in the pile.
  </Notes>
</Slide>

<Slide layout="applet">
  ## Sort them
  <four-box-sorter></four-box-sorter>
  <Notes>
    Optional - use the applet if the room needs a change of pace, otherwise go
    straight to sticky notes on the wall, which is better because they stand up.
  </Notes>
</Slide>

<Slide layout="activity">
  ## Put them on the wall
  <p class="prompt">Pick three objects. One input, one output, one storage each.</p>
  <Notes>
    Sticky notes under the four wall sheets. Physical, out of their chairs.
    This is the assessment for the whole lesson disguised as a game - watch which
    box they hesitate on. It is almost always storage.
  </Notes>
</Slide>

{/* ---------- Part 4: The Reveal (0:38-0:46) ---------- */}

<Slide layout="big-question">
  # How many computers are in this house?
  <p class="prompt">Write a number in your notebook. Commit to it out loud.</p>
  <Notes>
    Make them write it down before you say anything. A guess you have committed
    to is a guess you care about being wrong.
  </Notes>
</Slide>

<Slide layout="table">
  ## Let's count
  <Notes>
    Phones, tablets, laptops, TV, TV remote, streaming stick, console and each
    controller, microwave, dishwasher, washer, dryer, thermostat, doorbell,
    router, smart speaker, every car, digital watches, the fridge maybe, and the
    two Pi 400s on the floor.

    Real houses land north of fifty.
  </Notes>
</Slide>

<Slide layout="statement">
  ## Most computers don't look like computers
  <Notes>
    The desk-shaped one with a screen is the unusual case. It is the
    GENERAL-PURPOSE one - the only one that will do whatever you tell it. Every
    other computer in the house was built to do exactly one job forever. That is
    SPECIAL-PURPOSE.

    That distinction is where the rest of the course lives. Name it now.
  </Notes>
</Slide>

<Slide layout="activity">
  ## Back to your answers
  <p class="prompt">Which ones survived?</p>
  <Notes>
    Bring their sticky notes back. "It has a screen" - dead, the router has none.
    "It's smart" - dead, the abacus isn't a computer but the dumb little remote is.

    Let them cross out their own answers with the marker. Most satisfying ninety
    seconds of the lesson, and it teaches that a definition is something you TEST,
    not something you are handed.
  </Notes>
</Slide>

{/* ---------- Part 5: Notebook and Homework (0:46-0:50) ---------- */}

<Slide layout="notebook">
  ## Notebook, page 1
  <p class="prompt">Draw the four boxes. Write what each one means, in your own words.</p>
  <Notes>
    Their own words, not yours. A copied sentence teaches nothing.

    This diagram gets referenced in Lessons 2, 31 and 32, so it is worth the five
    minutes of doing it by hand.
  </Notes>
</Slide>

<Slide layout="statement">
  ## Computer hunt
  <p class="prompt">Find a computer nobody named today. Defend its input, its output, and where it keeps things.</p>
  <Notes>
    One point each. Bonus point for something arguably a computer, argued well,
    either way. Reward the reasoning, not the verdict. Winner announced at the top
    of Lesson 2.
  </Notes>
</Slide>

<Slide layout="closer">
  # Next time we open the general-purpose one
  <Notes>
    Point at the Pi 400 on the floor. End there.
  </Notes>
</Slide>
```

**Timing plan** (rendered in the guide from a `timing` frontmatter field if you add one, otherwise from the section comments):

| Time | Part | Slides |
|---|---|---|
| 0:00–0:08 | The question | 1–3 |
| 0:08–0:20 | The four boxes | 4–7 |
| 0:20–0:38 | The table under the towel | 8–10 |
| 0:38–0:46 | The reveal | 11–14 |
| 0:46–0:50 | Notebook and homework | 15–17 |

---

## 19. Decisions left to the human

Leave these as `TODO(human):` and surface them in a `DECISIONS.md`:

1. **Repo name and GitHub user**, for the base path.
2. **Public or private.** If public, the kids' names and any photos of them stay out. Prefer first initials.
3. **Dark mode** — probably never needed.
4. **Whether lesson status is public.** `taught` vs `draft` is useful internally and slightly odd to a stranger.
5. **Photos.** Several lessons want real photographs (ENIAC, a punch card, the inside of a tower, the Pi 400's ports). Public domain sources exist for the historical ones; the rest should be photographs the parent takes of their own equipment, which is better anyway because it is the machine the kids are looking at.
6. **Whether to keep the curriculum in the repo as `curriculum.yaml` or move to a database of one file per lesson.** YAML is right until it isn't.

---

## 20. One thing to hold on to

The site is not the course. The course is two children, two Pi 400s, a table of objects under a towel, and a parent who knows this material cold. The site exists to remove the parts of that which are drudgery — laying out slides, keeping a materials list true, drawing a diagram that would be better if it were clickable — and to make the interactive things possible at all.

So when a choice comes up between a feature that would look impressive and a feature that would save the parent twenty minutes on a Tuesday night, build the second one.
