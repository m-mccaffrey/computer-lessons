/**
 * Stamp each slide with its position in the deck.
 *
 * A slide cannot know its own index — Astro renders components without telling
 * them where they sit among their siblings — and a module-level counter would
 * be wrong the moment Astro renders two pages concurrently. Deck.astro is the
 * one component that holds the whole sequence, so it renders its slot to HTML
 * and stamps positions on the way past. Deterministic, and correct whatever
 * order pages build in.
 *
 * The marker is `data-slide`, which only Slide.astro emits, so there is no
 * chance of matching author markup.
 */

export interface StampResult {
  html: string
  total: number
}

export interface StampOptions {
  /**
   * Heading level for a slide's headline.
   *
   * A lesson writes its headline as `#`, which is right in the source and wrong
   * in the document: the page already has an h1 (the lesson title), and spec §13
   * allows exactly one. So headlines are demoted on the way out — to h2 in a
   * deck, and to h3 in the guide, where they sit under the guide's own section
   * headings.
   */
  headingLevel?: 2 | 3
}

const SLIDE_OPEN = /<(section|article)\b([^>]*?\bdata-slide\b[^>]*)>/g

export function stampSlides(html: string, options: StampOptions = {}): StampResult {
  const { headingLevel = 2 } = options
  const total = (html.match(SLIDE_OPEN) ?? []).length
  if (total === 0) return { html: demoteHeadings(html, headingLevel), total: 0 }

  const pad = (n: number) => String(n).padStart(2, '0')
  const count = pad(total)

  let i = 0
  const stamped = html.replace(SLIDE_OPEN, (_match, tag: string, attrs: string) => {
    const index = i++
    const human = index + 1
    // Progress is "how far through the lesson this slide leaves you", so the
    // first slide shows a sliver and the last one fills the rail.
    const progress = total === 1 ? 1 : human / total

    // The slide number is stamped as a custom property rather than derived from
    // a CSS counter. Counters do not increment on display:none elements, and
    // present mode hides every slide but one — so a counter would print "01 / 17"
    // on all seventeen of them.
    // Single quotes around the CSS strings, because this is being written into a
    // double-quoted HTML attribute and a double quote here closes it early.
    const style =
      `--rail-progress:${progress.toFixed(4)};` +
      `--slide-num:'${pad(human)}';` +
      `--slide-count:'${count}'`

    const extra =
      ` data-index="${index}"` +
      ` style="${style}"` +
      (tag === 'section' ? ` aria-label="Slide ${human} of ${total}"` : '')
    return `<${tag}${attrs}${extra}>`
  })

  return { html: demoteHeadings(stamped, headingLevel), total }
}

/**
 * Push every heading in the slide stream down to start at `top`.
 *
 * A slide carries one headline, so h1 and h2 both land on `top` and anything
 * deeper goes one below it. Only the slide stream passes through here, so no
 * page-level heading is touched.
 */
function demoteHeadings(html: string, top: 2 | 3): string {
  const level = (n: number) => Math.min(6, n <= 2 ? top : top + 1)
  return html.replace(/<(\/?)h([1-3])\b/g, (_m, slash: string, n: string) => `<${slash}h${level(Number(n))}`)
}

/** Escape a string for use inside a CSS `content:` declaration. */
export function cssString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}
