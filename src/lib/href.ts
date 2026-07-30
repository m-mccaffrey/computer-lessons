/**
 * The only sanctioned way to write an internal URL.
 *
 * GitHub Pages serves a project site from /<repo>/, so a bare "/lessons/01/"
 * resolves to the wrong place in production and the right place in dev — which
 * is exactly how this breaks five minutes before a lesson and not before.
 * `scripts/check-content.mjs` lints for raw absolute internal hrefs.
 */

const BASE: string = import.meta.env.BASE_URL // always ends in "/" given trailingSlash: 'always'

/**
 * Join a site-relative path onto the configured base path.
 *
 *   href('lessons/01')  -> "/computer-lessons/lessons/01/"
 *   href('/glossary/')  -> "/computer-lessons/glossary/"
 *   href('')            -> "/computer-lessons/"
 *
 * Paths with a file extension, a hash, or a query keep their exact shape:
 *
 *   href('sw.js')       -> "/computer-lessons/sw.js"
 *   href('lessons/01/#7') -> "/computer-lessons/lessons/01/#7"
 */
export function href(path = ''): string {
  const clean = String(path).replace(/^\/+/, '')
  if (clean === '') return BASE

  const [pathname = '', rest = ''] = splitOnce(clean, /[#?]/)
  const isFile = /\.[a-z0-9]+$/i.test(pathname)
  const trailing = isFile || pathname === '' ? '' : '/'
  const normalized = pathname.replace(/\/+$/, '') + trailing

  return BASE + normalized + rest
}

/** Absolute URL, for the sitemap, canonical tags and Open Graph. */
export function absolute(path = ''): string {
  return new URL(href(path), import.meta.env.SITE ?? 'https://example.invalid').toString()
}

/** Zero-padded lesson slug: 1 -> "01", 56 -> "56". */
export function lessonSlug(n: number): string {
  return String(n).padStart(2, '0')
}

/** URL of a lesson deck, optionally at a given slide index. */
export function lessonHref(n: number, slide?: number): string {
  const base = `lessons/${lessonSlug(n)}`
  return href(slide === undefined ? base : `${base}/#${slide}`)
}

export function guideHref(n: number): string {
  return href(`lessons/${lessonSlug(n)}/guide`)
}

export function presenterHref(n: number): string {
  return href(`lessons/${lessonSlug(n)}/presenter`)
}

export function unitHref(n: number): string {
  return href(`units/${n}`)
}

function splitOnce(s: string, re: RegExp): [string, string] {
  const i = s.search(re)
  return i === -1 ? [s, ''] : [s.slice(0, i), s.slice(i)]
}
