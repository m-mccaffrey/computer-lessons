import { defineCollection, z } from 'astro:content'
import { glob, file } from 'astro/loaders'
import { parse as parseYaml } from 'yaml'

const LESSON_MIN = 1
const LESSON_MAX = 56
const UNIT_MIN = 0
const UNIT_MAX = 8

const lessonRef = z.number().int().min(LESSON_MIN).max(LESSON_MAX)

const lessons = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/lessons' }),
  schema: z.object({
    n: lessonRef,
    title: z.string().min(1),
    unit: z.number().int().min(UNIT_MIN).max(UNIT_MAX),
    duration: z.number().int().positive().default(50),

    /** ONE sentence. What they can do afterwards. This is the acceptance test. */
    goal: z.string().min(1),

    status: z.enum(['stub', 'draft', 'ready', 'taught']).default('stub'),

    /** Physical objects to gather. Feeds /materials/. */
    props: z.array(z.string()).default([]),
    /** Things to do before the session. Also feeds /materials/. */
    prep: z.array(z.string()).default([]),
    /** New terms. Every one must exist in glossary/terms.yaml. */
    vocab: z.array(z.string()).default([]),

    homework: z.string().optional(),

    /** The spiral. Validated for existence and symmetry in check-content.mjs. */
    callsBackTo: z.array(lessonRef).default([]),
    setsUp: z.array(lessonRef).default([]),

    /** Custom element tag names used by this lesson's slides. */
    applets: z.array(z.string()).default([]),

    /** true = the Pi 400s stay closed. */
    unplugged: z.boolean().default(false),

    /** Guide only. Never rendered on a slide. */
    extraProblems: z.array(z.string()).default([]),
    pitfalls: z.array(z.string()).default([]),

    /** Optional timing plan, rendered in the guide. */
    timing: z
      .array(
        z.object({
          from: z.string(), // "0:00"
          to: z.string(), // "0:08"
          part: z.string(),
          slides: z.string().optional(), // "1-3"
        })
      )
      .default([]),
  }),
})

const units = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/units' }),
  schema: z.object({
    n: z.number().int().min(UNIT_MIN).max(UNIT_MAX),
    title: z.string().min(1),
    color: z.string().min(1), // the resistor band name, for the record
    arc: z.string().min(1),
  }),
})

const glossary = defineCollection({
  loader: file('./src/content/glossary/terms.yaml', {
    parser: (text) => {
      // Keyed by term so the loader gets stable ids without a separate id field.
      const parsed = parseYamlTerms(text)
      return Object.fromEntries(parsed.map((t) => [t.term, t]))
    },
  }),
  schema: z.object({
    term: z.string().min(1),
    /** Kid-facing. One or two sentences, second person, no jargon. */
    definition: z.string().min(1),
    /** Longer note for the parent. Optional. */
    forTheParent: z.string().optional(),
    /** Lesson where the term is first defined. */
    firstTaught: lessonRef.optional(),
    /** false = still a TODO(human) placeholder, surfaced on /glossary/. */
    written: z.boolean().default(false),
    seeAlso: z.array(z.string()).default([]),
  }),
})

/**
 * The `file()` loader hands us raw text; we parse with the same YAML library the
 * scaffold writes with so the two can never disagree about the format.
 */
function parseYamlTerms(text: string): Array<Record<string, unknown>> {
  const doc = parseYaml(text)
  return Array.isArray(doc?.terms) ? doc.terms : []
}

export const collections = { lessons, units, glossary }
