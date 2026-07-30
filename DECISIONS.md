# Decisions left to the human

Spec §19, plus what surfaced while building. Nothing here is blocking; each has
a working default in place, named so you can change it in one edit.

---

## 1. Repo name and GitHub user, for the base path

**Currently:** `site: 'https://m-mccaffrey.github.io'`, `base: '/computer-lessons/'`,
set in `astro.config.mjs` and read from there by `scripts/build-sw.mjs`.

Taken from the repository this was built in. If either is wrong, change the two
constants at the top of `astro.config.mjs` and nothing else — every internal URL
in the site goes through `href()` and `check-content.mjs` fails the build on any
that does not.

If you ever move to a user site (`user.github.io`) rather than a project site,
`base` becomes `'/'` and everything else still works.

## 2. Public or private

**Currently:** written as though public. No child's name, photograph, or
identifying detail appears anywhere in the repo, and the homepage is addressed to
"a stranger who found the repo" as spec §10 asks.

If you go public, keep it that way: first initials at most, and none of the
photographs you take for Unit 0 should have a child in frame.

## 3. Dark mode

**Currently:** not built. `TODO(human)` in `src/styles/tokens.css`.

The lessons happen in a lit room and the resistor palette is tuned for contrast
on `--paper`. Adding a dark theme means re-deriving all nine unit colours, which
is a real piece of work for no lesson-time benefit. Recommend never.

## 4. Whether lesson status is public

**Currently:** yes, and quietly. `/curriculum/` shows a status chip per lesson
and a filter bar, with `stub` styled in `--ink-3` so the unwritten majority does
not shout at a visitor.

If it reads as odd to a stranger, the fix is one line in
`src/pages/curriculum.astro` — drop the filter bar and the `.lesson__status`
span.

## 5. Photographs

**Currently:** three stand-ins exist at the exact paths Lesson 1 asks for:

```
public/media/l01/eniac.jpg
public/media/l01/vending.jpg
public/media/l01/traffic-light.jpg
```

Each is a grey card that says which photograph belongs there. **Replace the file;
do not edit the lesson.** `npm run check` lists which are still stand-ins, by
content hash, so the warning clears itself the moment you drop a real photo in.

- **ENIAC** — public domain images exist (US Army photographs). Wants: no screen,
  no keyboard, people walking between cabinets.
- **The vending machine and the traffic light** — take these yourself. The coin
  slot and the buttons need to be visible on one; the pedestrian button and its
  lit ring on the other, because that lit ring *is* the storage box.

`npm run placeholders` regenerates them; it never overwrites an existing file
without `--force`.

## 6. curriculum.yaml or one file per lesson

**Currently:** `curriculum.yaml`, kept verbatim as spec §17 requires, with
`scripts/scaffold-lessons.mjs` generating from it.

The seam to watch: the scaffold is one-way and non-destructive, so once a lesson
is written the YAML is no longer the source of truth for that lesson's content —
only for its place in the spiral. That is fine at 56 lessons. It stops being fine
if you start editing frontmatter in YAML and expecting it to propagate.

---

# Surfaced while building

## 7. Two curriculum references point at lessons that do not exist

`curriculum.yaml` contains:

```yaml
- n: 16 …  setsUp: [17, 71]
- n: 19 …  setsUp: [20, 74]
```

There is no lesson 71 or 74 — the course is 56 lessons. These look like remnants
of a longer draft. Lesson 16 is *Headings Beat Bold* and lesson 19 is
*Spreadsheets, Day One*, so the missing links were presumably to a long-document
lesson and a later spreadsheet lesson.

**Currently:** left out of the generated lessons rather than guessed at, and
reported as a warning by both the scaffold and `npm run check`. Working out what
those lessons were is pedagogy, not plumbing.

**To resolve:** either delete the two references, or point them at the real
lessons (18 and 20/21 are the plausible candidates). Then re-run
`npm run scaffold -- --force`.

## 8. Lesson 1 lists an applet that its deck does not place

`curriculum.yaml` gives lesson 1 `applets: [four-box-sorter, computer-or-not]`,
and spec §15 phase 5 says to build both. But the reference deck in spec §18 only
ever places `four-box-sorter` on a slide.

**Currently:** §18's deck is reproduced exactly — seventeen slides, no more — and
both applets are built. `computer-or-not` is live and playable at `/applets/`,
which is a legitimate place for it to live: spec §10 says the kids will come back
to the applets on their own, and this is a good one to come back to.

`npm run check` reports it, because "listed in frontmatter, on no slide" is worth
knowing about in general.

**To resolve:** either add a slide for it in Part 3 — the argument pile is its
natural home — and shift the `timing` block by one slide, or drop it from the
lesson's `applets` and treat it as a between-lessons toy.

## 9. Whether the applet catalog should list what is not built

**Currently:** yes. `/applets/` shows two built applets live, then lists the other
33 from spec §12 with the misconception each is meant to fix.

The argument for: it makes the shape of the remaining work visible, and stops a
lesson quietly rendering an empty box. The argument against: a stranger sees a
mostly-unbuilt site. Change by filtering `APPLETS` in `src/lib/applets.ts`.

## 10. Slide chrome sits below the spec's own 24px floor

Spec §8.4 sets the `label` size at 20px and §8.4 also says nothing on a slide goes
below 24px. Both cannot be true.

**Currently:** the 20px `label` size is used only for the eyebrow and the slide
number — chrome, not something a child has to read — and `check-content.mjs`
enforces the 24px floor on slide *content*. If you would rather the floor be
absolute, bump `.eyebrow` and `.slide__num` in `src/styles/deck.css` to 24px.
