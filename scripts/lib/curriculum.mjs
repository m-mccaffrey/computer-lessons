/**
 * Read and normalise src/content/curriculum.yaml.
 *
 * curriculum.yaml is the human's document and is kept verbatim. It is written
 * the way a person naturally writes a spiral: you note "this calls back to
 * lesson 10" on the later lesson and only sometimes remember to note the
 * forward link on the earlier one. Of the 82 relations in the file, 41 are
 * declared in one direction only.
 *
 * Spec §5 requires the relation to be symmetric and fails the build otherwise.
 * Both things can be true: the *authoring* format stays one-directional, and
 * the normalised form this module produces is the symmetric closure. The
 * generated lesson files carry the closure, and check-content.mjs enforces
 * symmetry on those — so hand-editing a lesson and breaking a thread still
 * fails the build, which is the drift the rule is actually there to catch.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { parse } from 'yaml'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const CURRICULUM_PATH = path.join(ROOT, 'src/content/curriculum.yaml')

export function loadCurriculum() {
  const raw = parse(readFileSync(CURRICULUM_PATH, 'utf8'))
  const lessons = raw.lessons ?? []
  const valid = new Set(lessons.map((l) => l.n))

  /** References to lessons that do not exist. Reported, never silently dropped. */
  const dangling = []

  for (const l of lessons) {
    for (const key of ['callsBackTo', 'setsUp']) {
      for (const target of l[key] ?? []) {
        if (!valid.has(target)) dangling.push({ from: l.n, key, target })
      }
    }
  }

  // Symmetric closure, computed over in-range references only.
  const callsBackTo = new Map(lessons.map((l) => [l.n, new Set()]))
  const setsUp = new Map(lessons.map((l) => [l.n, new Set()]))

  for (const l of lessons) {
    for (const t of l.callsBackTo ?? []) {
      if (!valid.has(t) || t === l.n) continue
      callsBackTo.get(l.n).add(t)
      setsUp.get(t).add(l.n)
    }
    for (const t of l.setsUp ?? []) {
      if (!valid.has(t) || t === l.n) continue
      setsUp.get(l.n).add(t)
      callsBackTo.get(t).add(l.n)
    }
  }

  const sorted = (s) => [...s].sort((a, b) => a - b)

  // Lesson 50 teaches the words `true` and `false`, which YAML is delighted to
  // hand back as booleans. Every list of terms is coerced to strings on the way
  // in, so the one lesson in the course that is *about* booleans does not break
  // the course.
  const strings = (v) => (v ?? []).map((x) => String(x))

  const normalised = lessons
    .map((l) => ({
      n: l.n,
      unit: l.unit,
      title: l.title,
      goal: l.goal,
      duration: l.duration ?? raw.course?.session ?? 50,
      unplugged: l.unplugged ?? false,
      vocab: strings(l.vocab),
      props: strings(l.props),
      prep: strings(l.prep),
      applets: strings(l.applets),
      homework: l.homework,
      pitfalls: strings(l.pitfalls),
      extraProblems: strings(l.extraProblems),
      callsBackTo: sorted(callsBackTo.get(l.n)),
      setsUp: sorted(setsUp.get(l.n)),
    }))
    .sort((a, b) => a.n - b.n)

  return { course: raw.course, units: raw.units ?? [], lessons: normalised, dangling }
}

/** "What Is a Computer?" -> "what-is-a-computer" */
export function slugify(title) {
  return String(title)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const pad = (n) => String(n).padStart(2, '0')

export function lessonFilename(lesson) {
  return `${pad(lesson.n)}-${slugify(lesson.title)}.mdx`
}

export function unitFilename(unit) {
  return `${pad(unit.n)}-${slugify(unit.title)}.md`
}

/** Every distinct vocab term in the course, with the lesson that introduces it. */
export function collectVocab(lessons) {
  const terms = new Map()
  for (const l of lessons) {
    for (const term of l.vocab) {
      const key = String(term).trim()
      if (!key) continue
      if (!terms.has(key)) terms.set(key, { term: key, firstTaught: l.n, lessons: [] })
      terms.get(key).lessons.push(l.n)
      if (l.n < terms.get(key).firstTaught) terms.get(key).firstTaught = l.n
    }
  }
  return [...terms.values()].sort((a, b) => a.term.localeCompare(b.term))
}
