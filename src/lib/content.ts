import { getCollection, type CollectionEntry } from 'astro:content'
import { lessonSlug } from './href'

export type Lesson = CollectionEntry<'lessons'>
export type Unit = CollectionEntry<'units'>
export type Term = CollectionEntry<'glossary'>

/** All lessons, in teaching order. */
export async function allLessons(): Promise<Lesson[]> {
  const lessons = await getCollection('lessons')
  return lessons.sort((a, b) => a.data.n - b.data.n)
}

/** All units, in order. */
export async function allUnits(): Promise<Unit[]> {
  const units = await getCollection('units')
  return units.sort((a, b) => a.data.n - b.data.n)
}

export async function allTerms(): Promise<Term[]> {
  const terms = await getCollection('glossary')
  return terms.sort((a, b) => a.data.term.localeCompare(b.data.term))
}

/** Lesson lookup by number, for rendering threads as real links. */
export async function lessonIndex(): Promise<Map<number, Lesson>> {
  return new Map((await allLessons()).map((l) => [l.data.n, l]))
}

export async function unitIndex(): Promise<Map<number, Unit>> {
  return new Map((await allUnits()).map((u) => [u.data.n, u]))
}

/** Lessons grouped by unit, both in order. */
export async function lessonsByUnit(): Promise<Map<number, Lesson[]>> {
  const grouped = new Map<number, Lesson[]>()
  for (const lesson of await allLessons()) {
    const list = grouped.get(lesson.data.unit) ?? []
    list.push(lesson)
    grouped.set(lesson.data.unit, list)
  }
  return grouped
}

/** The params every /lessons/[lesson]/ route shares. */
export async function lessonPaths() {
  const [lessons, units] = await Promise.all([allLessons(), unitIndex()])
  return lessons.map((lesson) => ({
    params: { lesson: lessonSlug(lesson.data.n) },
    props: { lesson, unit: units.get(lesson.data.unit) },
  }))
}

export const STATUS_LABEL: Record<string, string> = {
  stub: 'Not written yet',
  draft: 'Draft',
  ready: 'Ready to teach',
  taught: 'Taught',
}
