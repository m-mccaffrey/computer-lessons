/**
 * Which of the three reading situations (spec §2) is being rendered.
 *
 * This is resolved from the URL at *build* time, not from a query parameter at
 * runtime, and that is deliberate. Spec §6 requires <Notes> to be stripped from
 * the deck DOM entirely — "do not render it hidden with CSS; a curious
 * 9-year-old will find it with devtools". On a static host, a `?presenter=1`
 * query string cannot change the HTML that was shipped, so the notes would have
 * to be present-but-hidden in the deck. A distinct route can not-ship them.
 *
 * Hence: presenter view is /lessons/01/presenter/ rather than
 * /lessons/01/?presenter=1. The `S` key opens that URL. Same window layout,
 * same BroadcastChannel sync, but the deck the kids see genuinely does not
 * contain the teacher's notes.
 */
export type RenderMode = 'deck' | 'guide' | 'presenter'

export function renderMode(pathname: string): RenderMode {
  const p = pathname.replace(/\/+$/, '')
  if (p.endsWith('/guide')) return 'guide'
  if (p.endsWith('/presenter')) return 'presenter'
  return 'deck'
}

/** Modes in which teacher prose is allowed to render at all. */
export function showsNotes(mode: RenderMode): boolean {
  return mode === 'guide' || mode === 'presenter'
}
