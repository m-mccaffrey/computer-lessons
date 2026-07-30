#!/usr/bin/env node
/**
 * Content lint. Runs before every build, in CI and locally (`npm run check`).
 *
 * Two jobs:
 *
 *   1. Catch the things that break in production and nowhere else — a raw
 *      absolute internal href that works in dev and 404s on GitHub Pages, a
 *      thread pointing at a lesson that does not exist, an image that was never
 *      added. These are ERRORS and they fail the build.
 *
 *   2. Nag about the writing rules in spec §16 that can be checked mechanically —
 *      word counts, bullet counts, headline shape. These are WARNINGS, because a
 *      lint that blocks a build over prose is a lint that gets disabled.
 *
 * The distinction matters: a broken link ruins a lesson five minutes before it
 * starts. A 43-word slide is just a slide that wants another look.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'
import { ROOT, loadCurriculum } from './lib/curriculum.mjs'

const LESSONS_DIR = path.join(ROOT, 'src/content/lessons')
const GLOSSARY = path.join(ROOT, 'src/content/glossary/terms.yaml')
const PUBLIC = path.join(ROOT, 'public')
const SRC = path.join(ROOT, 'src')

const MANIFEST = path.join(PUBLIC, 'media/placeholders.json')
const PLACEHOLDER_HASHES = existsSync(MANIFEST)
  ? JSON.parse(readFileSync(MANIFEST, 'utf8'))
  : {}

const errors = []
const warnings = []
const err = (file, msg) => errors.push({ file, msg })
const warn = (file, msg) => warnings.push({ file, msg })

/* ========================================================== load lessons === */

const files = readdirSync(LESSONS_DIR).filter((f) => f.endsWith('.mdx')).sort()
const lessons = files.map((f) => {
  const raw = readFileSync(path.join(LESSONS_DIR, f), 'utf8')
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!m) {
    err(f, 'No frontmatter block.')
    return null
  }
  let data
  try {
    data = parseYaml(m[1])
  } catch (e) {
    err(f, `Frontmatter is not valid YAML: ${e.message}`)
    return null
  }
  return { file: f, data, body: m[2], raw }
}).filter(Boolean)

const byN = new Map(lessons.map((l) => [l.data.n, l]))

/* ================================================ 1. structural integrity == */

// Every n unique and in range.
const seen = new Map()
for (const l of lessons) {
  if (typeof l.data.n !== 'number') err(l.file, '`n` is missing or not a number.')
  else if (seen.has(l.data.n)) err(l.file, `Lesson number ${l.data.n} is also used by ${seen.get(l.data.n)}.`)
  else seen.set(l.data.n, l.file)

  if (!(l.data.unit >= 0 && l.data.unit <= 8)) err(l.file, `unit ${l.data.unit} is outside 0-8.`)
  if (!l.data.goal?.trim()) err(l.file, '`goal` is empty. It is the acceptance test for the lesson.')
}

// callsBackTo / setsUp: every target exists, and the relation is symmetric.
// Spec §5 requires this and requires the build to fail without it, because an
// asymmetric thread means the spiral has quietly come apart.
for (const l of lessons) {
  for (const t of l.data.callsBackTo ?? []) {
    const other = byN.get(t)
    if (!other) {
      err(l.file, `callsBackTo ${t}, which does not exist.`)
    } else if (!(other.data.setsUp ?? []).includes(l.data.n)) {
      err(l.file, `callsBackTo ${t}, but lesson ${t} does not list ${l.data.n} in setsUp. Threads must be symmetric.`)
    }
  }
  for (const t of l.data.setsUp ?? []) {
    const other = byN.get(t)
    if (!other) {
      err(l.file, `setsUp ${t}, which does not exist.`)
    } else if (!(other.data.callsBackTo ?? []).includes(l.data.n)) {
      err(l.file, `setsUp ${t}, but lesson ${t} does not list ${l.data.n} in callsBackTo. Threads must be symmetric.`)
    }
  }
}

/* =============================================== 2. glossary completeness == */

let terms = new Map()
if (!existsSync(GLOSSARY)) {
  err('glossary/terms.yaml', 'Missing. Run `npm run scaffold`.')
} else {
  try {
    const doc = parseYaml(readFileSync(GLOSSARY, 'utf8'))
    terms = new Map((doc?.terms ?? []).map((t) => [String(t.term), t]))
  } catch (e) {
    err('glossary/terms.yaml', `Not valid YAML: ${e.message}`)
  }
}

const unwrittenTerms = new Set()
for (const l of lessons) {
  for (const v of l.data.vocab ?? []) {
    const key = String(v)
    if (!terms.has(key)) {
      err(l.file, `vocab lists "${key}", which is not in glossary/terms.yaml. Run \`npm run scaffold\`.`)
    } else if (!terms.get(key).written) {
      unwrittenTerms.add(key)
    }
  }
}

/* ================================================== 3. the base-path trap == */
/* Spec §14: every internal link goes through href(). A bare "/lessons/01/"
   resolves correctly in dev and 404s in production, which is exactly the kind of
   bug that surfaces once, live, five minutes before a lesson. */

const LINKY = /\.(astro|mdx|ts|js|css)$/
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : LINKY.test(d.name) ? [path.join(dir, d.name)] : []
  )

// Absolute internal URLs in an href/src attribute that are not template
// expressions. Protocol-relative and external URLs are fine; so is "#".
const RAW_HREF = /\b(?:href|src)\s*=\s*"(\/(?!\/)[^"]*)"/g

for (const abs of walk(SRC)) {
  const rel = path.relative(ROOT, abs)
  const text = readFileSync(abs, 'utf8')
  for (const m of text.matchAll(RAW_HREF)) {
    err(rel, `Raw absolute link "${m[1]}". Internal links must go through href() so the GitHub Pages base path works.`)
  }
}

/* ======================================================= 4. media exists === */

const MEDIA = /href\(\s*['"](media\/[^'"]+)['"]\s*\)/g
const placeholders = []

for (const l of lessons) {
  for (const m of l.raw.matchAll(MEDIA)) {
    const file = path.join(PUBLIC, m[1])
    if (!existsSync(file)) {
      err(l.file, `references public/${m[1]}, which does not exist.`)
    } else if (isPlaceholder(file)) {
      placeholders.push(`${l.file} → public/${m[1]}`)
    }
  }
}

/* ============================================= 5. the writing rules (§16) == */

const SLIDE = /<Slide\b([^>]*)>([\s\S]*?)<\/Slide>/g

for (const l of lessons) {
  if (l.data.status === 'stub') continue // a stub is allowed to be unfinished

  const slides = [...l.body.matchAll(SLIDE)]

  if (slides.length === 0) {
    warn(l.file, 'has no slides.')
    continue
  }

  // §16.7 — every lesson ends with a Closer.
  const lastLayout = layoutOf(slides.at(-1)[1])
  if (lastLayout !== 'closer') {
    warn(l.file, `ends on a "${lastLayout}" slide. Every lesson ends with a Closer (§16.7).`)
  }

  slides.forEach((s, i) => {
    const n = i + 1
    const where = `${l.file} slide ${n}`
    const layout = layoutOf(s[1])
    const visible = stripNotes(s[2])

    // §16.2 — max ~40 words visible. Warn above 40, error above 60.
    const words = visible.split(/\s+/).filter(Boolean).length
    if (words > 60) err(where, `${words} visible words. The limit is 60 (§16.2).`)
    else if (words > 40) warn(where, `${words} visible words. Aim for 40 (§16.2).`)

    // §8.4 — nothing in slide content below 24px on the canvas.
    for (const m of visible.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) {
      if (Number(m[1]) < 24) err(where, `sets font-size ${m[1]}px. Nothing on a slide goes below 24px (§8.4).`)
    }

    // §16.4 — no bullet list longer than 4 items.
    const bullets = (visible.match(/^\s*[-*]\s+/gm) ?? []).length
    if (bullets > 4) warn(where, `${bullets} bullets. Above 4, use a TableSlide or successive <Beat>s (§16.4).`)

    // §16.1 and §16.3 — headline is a claim or a question, and holds one idea.
    const head = visible.match(/^\s*#{1,3}\s+(.+)$/m)?.[1]?.trim()
    if (head) {
      if (/\band\b/i.test(head) && head.split(/\s+/).length > 4) {
        warn(where, `headline "${head}" contains "and". If the headline needs an "and", it is two slides (§16.1).`)
      }
      if (head.length < 60 && head.split(/\s+/).length < 8 && /\.$/.test(head)) {
        warn(where, `headline "${head}" ends in a period. Short headlines take no terminal period (§16.12).`)
      }
    } else if (layout !== 'applet') {
      warn(where, 'has no headline.')
    }

    // Spec §2 — the classic failure: teacher prose pasted onto a slide.
    const prompts = (visible.match(/class="prompt"/g) ?? []).length
    if (prompts > 1) warn(where, `${prompts} prompt lines. A slide is a headline plus at most one supporting line (§6).`)
  })

  // Applets declared in frontmatter should actually appear, and vice versa.
  const used = new Set([...l.raw.matchAll(/<Applet\s+tag="([^"]+)"/g)].map((m) => m[1]))
  for (const m of l.raw.matchAll(/<([a-z][a-z0-9]*-[a-z0-9-]+)\b/g)) used.add(m[1])
  for (const a of l.data.applets ?? []) {
    if (!used.has(a) && l.data.status !== 'stub') {
      warn(
        l.file,
        `lists applet "${a}" in frontmatter but places it on no slide. ` +
          `Either put it on a slide, or treat it as a between-lessons toy reachable ` +
          `only from /applets/ — both are legitimate, but decide which.`
      )
    }
  }
}

/* ===================================== 6. curriculum.yaml's own dangling === */

const { dangling } = loadCurriculum()
for (const d of dangling) {
  warn('curriculum.yaml', `lesson ${d.from} ${d.key} ${d.target}, which does not exist in this course. Left out of the generated lessons; see DECISIONS.md.`)
}

/* ============================================================== reporting == */

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

if (warnings.length) {
  console.warn(`\n${plural(warnings.length, 'warning')}:`)
  for (const w of warnings) console.warn(`  ${w.file}\n    ${w.msg}`)
}

if (errors.length) {
  console.error(`\n${plural(errors.length, 'error')}:`)
  for (const e of errors) console.error(`  ${e.file}\n    ${e.msg}`)
}

if (placeholders.length) {
  console.warn(`\n${plural(placeholders.length, 'placeholder image')} still standing in for a real photograph:`)
  for (const p of placeholders) console.warn(`  ${p}`)
}

if (unwrittenTerms.size) {
  console.warn(`\n${plural(unwrittenTerms.size, 'word has', 'words have')} no definition written yet.`)
  console.warn('  They are listed on /glossary/. Definitions are pedagogy — see CLAUDE.md.')
}

console.log(
  `\ncheck: ${lessons.length} lessons, ${terms.size} glossary terms, ` +
    `${errors.length} error(s), ${warnings.length} warning(s).`
)

process.exit(errors.length ? 1 : 0)

/* =============================================================== helpers == */

function layoutOf(attrs) {
  return attrs.match(/layout="([^"]+)"/)?.[1] ?? 'statement'
}

/** What the children actually see: the slide with every <Notes> block removed. */
function stripNotes(body) {
  return body
    .replace(/<Notes>[\s\S]*?<\/Notes>/g, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
}

/**
 * Is this still one of the generated stand-ins?
 *
 * Compared by content hash against public/media/placeholders.json, so that
 * dropping a real photograph over one clears it with nothing to remember.
 */
function isPlaceholder(file) {
  const rel = path.relative(PUBLIC, file).split(path.sep).join('/')
  const recorded = PLACEHOLDER_HASHES[rel]
  if (!recorded) return false
  return createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 16) === recorded
}
