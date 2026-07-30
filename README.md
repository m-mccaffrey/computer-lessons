# Computers — a course for two kids

A 56-lesson course teaching two children (7 and 9) to be competent, unafraid,
non-mystified computer users. Not a computer science course. Not an engineering
course.

> A competent adult should be able to buy a computer, drive it, make documents
> with it, understand why it is slow, not lose their files, not get scammed, and
> not be afraid of it.

Every lesson is one file. The kids get a **deck** — big type, one idea a slide.
The parent gets a **guide** generated from the same file: what to gather, what to
say, what goes wrong, and the answers. The materials list and the glossary are
generated from the lessons, so they cannot quietly stop being true.

## Running it

```sh
npm install
npm run dev      # http://localhost:4321/computer-lessons/
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server. Slides that overflow the canvas are outlined in `--warn`. |
| `npm run check` | Content lint, cross-reference check, type check. Run before committing. |
| `npm run build` | Check, build, then generate the service worker. |
| `npm run scaffold` | Regenerate lesson stubs, unit intros, and the glossary from `curriculum.yaml`. Never overwrites a written lesson. |
| `npm run placeholders` | Stand-in images for photographs not taken yet. Never overwrites a real one. |

Node 20+. The build runs on GitHub Actions and on a laptop, never on the Pi.

## Where things are

| Thing | Path |
|---|---|
| The curriculum, verbatim | `src/content/curriculum.yaml` |
| Lessons | `src/content/lessons/NN-slug.mdx` |
| Deck engine | `src/components/deck/` |
| Slide layouts | `src/components/slides/` |
| Applets | `src/components/applets/` |
| Design tokens — every colour and size | `src/styles/tokens.css` |
| Every layout on one page | `/dev/layouts/` |
| Open questions | [`DECISIONS.md`](DECISIONS.md) |
| The full build spec | [`BUILD-SPEC.md`](BUILD-SPEC.md) |

## Driving a deck

| Key | |
|---|---|
| `→` `↓` `space` | Next beat, then next slide |
| `←` `↑` | Back |
| `home` / `end` | First / last slide |
| `f` | Fullscreen |
| `o` | Overview grid |
| `p` | Present / read |
| `s` | Presenter window |
| `b` | Blackout — everyone look at me |
| `?` | Key help |

Clicking the right third of the screen advances, the left third goes back, and
the middle third does nothing so applets stay clickable. Tab into an applet and
the arrow keys belong to it until you press `esc`.

## What it never does

No accounts, no backend, no database. No analytics — nothing about the children
is tracked, counted, or sent anywhere. No scores, streaks, or badges. It works
offline once loaded, because home internet failing must not cancel a lesson.

## State of the build

Built: the deck engine, all thirteen slide layouts, the content pipeline over all
56 lessons, the generated materials list and glossary, the offline service
worker, and Lesson 1 in full as the reference implementation — with its two
applets, `four-box-sorter` and `computer-or-not`.

Lessons 2–56 are generated stubs carrying real frontmatter and real threads. They
are written one unit at a time, and — per the spec — each unit gets taught before
the next is built, because the curriculum changes based on what happens in the
room.
