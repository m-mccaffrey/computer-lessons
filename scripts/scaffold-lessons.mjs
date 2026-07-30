#!/usr/bin/env node
/**
 * Generate lesson stubs, unit intros, and the glossary skeleton from
 * curriculum.yaml.
 *
 * Generation is one-way and non-destructive: a file that already exists is left
 * alone. Once the parent has written a lesson, this script must never be the
 * thing that eats it. Run with --force to rewrite stubs anyway (it still
 * refuses to touch anything whose status is not `stub`).
 *
 *   node scripts/scaffold-lessons.mjs
 *   node scripts/scaffold-lessons.mjs --force
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { stringify, parse } from 'yaml'
import {
  ROOT,
  loadCurriculum,
  lessonFilename,
  unitFilename,
  collectVocab,
} from './lib/curriculum.mjs'

const force = process.argv.includes('--force')

const LESSONS_DIR = path.join(ROOT, 'src/content/lessons')
const UNITS_DIR = path.join(ROOT, 'src/content/units')
const GLOSSARY_PATH = path.join(ROOT, 'src/content/glossary/terms.yaml')

const { course, units, lessons, dangling } = loadCurriculum()

mkdirSync(LESSONS_DIR, { recursive: true })
mkdirSync(UNITS_DIR, { recursive: true })
mkdirSync(path.dirname(GLOSSARY_PATH), { recursive: true })

const tally = { lessons: 0, units: 0, skipped: 0, terms: 0 }

/* --------------------------------------------------------------- lessons --- */

for (const lesson of lessons) {
  const file = path.join(LESSONS_DIR, lessonFilename(lesson))

  if (existsSync(file) && !force) {
    tally.skipped += 1
    continue
  }
  if (existsSync(file) && force && !/^status:\s*stub\s*$/m.test(readFileSync(file, 'utf8'))) {
    // --force is for regenerating stubs, not for discarding written lessons.
    tally.skipped += 1
    continue
  }

  writeFileSync(file, lessonStub(lesson), 'utf8')
  tally.lessons += 1
}

/* ----------------------------------------------------------------- units --- */

for (const unit of units) {
  const file = path.join(UNITS_DIR, unitFilename(unit))
  if (existsSync(file) && !force) continue
  writeFileSync(file, unitStub(unit), 'utf8')
  tally.units += 1
}

/* -------------------------------------------------------------- glossary --- */

const vocab = collectVocab(lessons)
const existing = readExistingTerms()
const merged = vocab.map((v) => {
  const prior = existing.get(v.term)
  // Anything already written by a human survives untouched.
  if (prior?.written) return prior
  return {
    term: v.term,
    definition: prior?.definition ?? `TODO(human): kid-facing definition of "${v.term}".`,
    firstTaught: v.firstTaught,
    written: false,
    ...(prior?.forTheParent ? { forTheParent: prior.forTheParent } : {}),
    ...(prior?.seeAlso?.length ? { seeAlso: prior.seeAlso } : {}),
  }
})

// A term a human wrote that has since left the curriculum is kept, not deleted:
// losing a written definition to a curriculum edit would be the worst possible
// behaviour for this script.
for (const [term, entry] of existing) {
  if (entry.written && !merged.some((m) => m.term === term)) merged.push(entry)
}
merged.sort((a, b) => a.term.localeCompare(b.term))

writeFileSync(GLOSSARY_PATH, glossaryFile(merged), 'utf8')
tally.terms = merged.length

/* ------------------------------------------------------------- reporting --- */

console.log(
  `scaffold: ${tally.lessons} lesson stub(s), ${tally.units} unit intro(s), ` +
    `${tally.terms} glossary term(s), ${tally.skipped} left alone`
)

if (dangling.length) {
  console.warn(
    `\nscaffold: ${dangling.length} reference(s) in curriculum.yaml point at lessons ` +
      `that do not exist in this ${lessons.length}-lesson course:`
  )
  for (const d of dangling) console.warn(`  lesson ${d.n ?? d.from} ${d.key} ${d.target}`)
  console.warn(
    `They are left out of the generated files rather than guessed at. ` +
      `See DECISIONS.md — deciding what those lessons were is pedagogy, not plumbing.\n`
  )
}

/* ------------------------------------------------------------- templates --- */

function lessonStub(lesson) {
  const fm = {
    n: lesson.n,
    title: lesson.title,
    unit: lesson.unit,
    duration: lesson.duration,
    goal: lesson.goal,
    status: 'stub',
    unplugged: lesson.unplugged,
    vocab: lesson.vocab,
    props: lesson.props,
    prep: lesson.prep,
    applets: lesson.applets,
    callsBackTo: lesson.callsBackTo,
    setsUp: lesson.setsUp,
    ...(lesson.homework ? { homework: lesson.homework } : {}),
    ...(lesson.pitfalls.length ? { pitfalls: lesson.pitfalls } : {}),
    ...(lesson.extraProblems.length ? { extraProblems: lesson.extraProblems } : {}),
  }

  const frontmatter = stringify(fm, { lineWidth: 0 }).trimEnd()

  return `---
${frontmatter}
---

import { Slide, Notes, Beat } from '@components/deck'

{/* Generated stub. The curriculum is the human's; this file only holds a place
    for it. Write the lesson by following the shape of lesson 1, which is the
    reference implementation: headline plus at most one short line on the slide,
    everything else in <Notes>. */}

<Slide layout="title">
  # ${escapeMd(lesson.title)}
  <Notes>
    TODO(human): write this lesson.

    Goal: ${escapeMd(lesson.goal)}

    Spec §16.8 — open with something that is not you talking. A question, an
    object on the table, or the result of last time's homework.
  </Notes>
</Slide>

<Slide layout="closer">
  # TODO(human): the one sentence to remember
  <Notes>
    Every lesson ends with a Closer (spec §16.7). One sentence, the thing that
    survives until next week.
  </Notes>
</Slide>
`
}

function unitStub(unit) {
  const fm = stringify(
    { n: unit.n, title: unit.title, color: unit.color, arc: unit.arc.trim() },
    { lineWidth: 0 }
  ).trimEnd()

  return `---
${fm}
---

TODO(human): the unit introduction, written for someone reading the site rather
than sitting in the lesson. What changes between the first lesson of this unit
and the last one?

The arc from curriculum.yaml is rendered above this prose on /units/${unit.n}/, so
do not repeat it here.
`
}

function glossaryFile(terms) {
  const header = `# Generated by scripts/scaffold-lessons.mjs from every lesson's \`vocab\`.
#
# Definitions are pedagogy and belong to the human. This file only guarantees
# that every term a lesson claims to teach has somewhere to be written down.
#
# Set \`written: true\` once a definition is real; the scaffold will then never
# touch that entry again, and /glossary/ will stop flagging it as unwritten.
#
# Style: second person, present tense, one or two sentences, no term the child
# has not met yet. "${course?.title ?? 'Computers'}" is read by a 7-year-old.

`
  return header + stringify({ terms }, { lineWidth: 88 })
}

function readExistingTerms() {
  if (!existsSync(GLOSSARY_PATH)) return new Map()
  try {
    const doc = parse(readFileSync(GLOSSARY_PATH, 'utf8'))
    return new Map((doc?.terms ?? []).map((t) => [t.term, t]))
  } catch {
    // A malformed glossary is a thing to fix, not a reason to lose the run;
    // check-content.mjs will report it properly.
    return new Map()
  }
}

function escapeMd(s) {
  return String(s).replace(/([<>{}])/g, '\\$1')
}
