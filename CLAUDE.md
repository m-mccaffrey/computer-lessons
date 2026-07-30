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

## Where things are

| Thing | Path |
|---|---|
| The curriculum, verbatim | `src/content/curriculum.yaml` |
| Lessons (one file each) | `src/content/lessons/NN-slug.mdx` |
| The deck engine | `src/components/deck/` |
| Slide layouts (spec §9) | `src/components/slides/` |
| Applets | `src/components/applets/` |
| Design tokens | `src/styles/tokens.css` |
| Every layout, on one page | `/dev/layouts/` |
| Open questions for the human | `DECISIONS.md` |

## Commands

```
npm run dev           # localhost:4321/computer-lessons/
npm run check         # content lint + cross-references + astro check
npm run build         # check, build, then generate the service worker
npm run scaffold      # regenerate stubs/units/glossary from curriculum.yaml
npm run placeholders  # stand-in images for photographs not yet taken
```

## Things that will bite you

- **`npm run scaffold` never overwrites a written lesson.** It skips any file that
  already exists; `--force` additionally refuses anything whose `status` is not
  `stub`. Keep it that way.
- **curriculum.yaml is authored one-directionally.** People write "this calls back
  to lesson 10" on the later lesson and forget the forward link. The scaffold
  computes the symmetric closure; `check-content.mjs` then enforces symmetry on
  the *generated* lessons, which is where drift actually happens.
- **YAML will hand you booleans.** Lesson 50's vocabulary is literally the words
  `true` and `false`. Every list of terms is coerced to strings when read.
- **CSS counters cannot number the slides.** Present mode hides all but the active
  slide, and counters skip `display: none`. Slide numbers are stamped at build
  time as `--slide-num` / `--slide-count` by `src/lib/stamp.ts`.
- **Presenter view is a route, not `?presenter=1`.** On a static host a query
  string cannot change the HTML that shipped, and the notes have to be genuinely
  absent from the deck rather than hidden. See `src/lib/mode.ts`.
- **Fonts live in `src/fonts/`, not `public/`,** so Vite rewrites their URLs
  against the base path. A hand-written `/fonts/...` is right in dev and 404s in
  production — the exact trap spec §14 warns about.
- **Adding a slide to a lesson shifts its timing plan.** The `timing` frontmatter
  refers to slide numbers; update it in the same commit.

## Writing a lesson

Copy the shape of `01-what-is-a-computer.mdx`. It is the reference
implementation and the thing every other lesson is measured against.

The rule that matters more than the rest: **the visible text of a slide is a
headline plus at most one short line.** Everything you would say out loud goes in
`<Notes>`. If you find yourself pasting a paragraph onto a slide, that is the
failure mode this whole structure exists to prevent.
