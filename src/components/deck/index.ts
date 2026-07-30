/**
 * The three things a lesson file imports.
 *
 *   import { Slide, Notes, Beat } from '@components/deck'
 *
 * Slide layouts are chosen with the `layout` prop rather than by importing a
 * dozen components, so that a lesson file stays readable as a lesson.
 */
export { default as Slide } from './Slide.astro'
export { default as Notes } from './Notes.astro'
export { default as Beat } from './Beat.astro'
export { default as Deck } from './Deck.astro'
