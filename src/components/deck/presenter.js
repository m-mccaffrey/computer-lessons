/**
 * The presenter console.
 *
 * Listens on the same BroadcastChannel as the deck, moves two iframes to the
 * current and next slide, swaps the notes panel, and runs an elapsed timer.
 * Arrow keys here drive the deck window too, so the parent can advance from
 * whichever window has focus.
 */
import { openChannel } from './channel.js'

const root = document.querySelector('[data-presenter]')
if (root) init(root)

function init(el) {
  const lesson = el.dataset.lesson
  const deckUrl = el.dataset.deckUrl
  const frameNow = el.querySelector('[data-frame="now"]')
  const frameNext = el.querySelector('[data-frame="next"]')
  const notesHost = el.querySelector('[data-notes-host]')
  const posEl = el.querySelector('[data-pos]')
  const countEl = el.querySelector('[data-count]')

  // Every slide's notes, rendered into an inert <template> at build time.
  const source = document.querySelector('[data-notes-source]')
  const cards = source ? [...source.content.querySelectorAll('.guide-slide')] : []
  const total = cards.length
  countEl.textContent = String(total)

  let index = 0

  function paint(i) {
    index = Math.max(0, Math.min(total - 1, i))
    posEl.textContent = String(index + 1)

    notesHost.replaceChildren(cards[index] ? cards[index].cloneNode(true) : empty())

    // Setting .src would push a history entry per slide; the hash alone moves
    // an already-loaded frame, which is also far cheaper.
    setHash(frameNow, index + 1)
    setHash(frameNext, Math.min(total, index + 2))

    highlightPlan(index + 1)
  }

  function setHash(frame, human) {
    const want = `${deckUrl}?thumb=1#${human}`
    if (!frame.contentWindow) {
      frame.src = want
      return
    }
    try {
      frame.contentWindow.location.hash = `#${human}`
    } catch {
      frame.src = want
    }
  }

  function empty() {
    const p = document.createElement('p')
    p.className = 'presenter__none'
    p.textContent = 'No notes on this slide.'
    return p
  }

  /* The plan row covering the current slide gets marked, so a glance says
     whether you are ahead or behind. */
  const planItems = [...el.querySelectorAll('.presenter__timing li')]
  function highlightPlan(human) {
    for (const li of planItems) {
      const [from, to] = String(li.dataset.slides ?? '')
        .split(/[-–]/)
        .map((s) => Number.parseInt(s, 10))
      const inRange = Number.isFinite(from) && human >= from && human <= (Number.isFinite(to) ? to : from)
      li.toggleAttribute('data-current', inRange)
    }
  }

  /* ---------------------------------------------------------------- sync --- */

  const channel = openChannel((msg) => {
    if (!msg || String(msg.lesson) !== String(lesson) || msg.from === 'presenter') return
    paint(msg.index)
  })

  function drive(delta) {
    // The presenter window does not own beat state; it asks the deck to move and
    // repaints when the deck answers. Sending an absolute index keeps the two
    // windows from arguing if a message is dropped.
    channel.post({ lesson, index: index + delta, beat: 0, from: 'presenter' })
    paint(index + delta)
  }

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ':
        drive(1); e.preventDefault(); break
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
        drive(-1); e.preventDefault(); break
    }
  })

  /* --------------------------------------------------------------- timer --- */
  /* Elapsed, not counting down. A countdown in the corner is pressure, and the
     one thing this site never does is put a child under a clock. */

  const out = el.querySelector('[data-timer]')
  const toggle = el.querySelector('[data-timer-toggle]')
  const reset = el.querySelector('[data-timer-reset]')
  let started = null
  let accumulated = 0
  let tick = null

  const fmt = (ms) => {
    const s = Math.floor(ms / 1000)
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  const render = () => (out.textContent = fmt(accumulated + (started ? Date.now() - started : 0)))

  toggle.addEventListener('click', () => {
    if (started) {
      accumulated += Date.now() - started
      started = null
      clearInterval(tick)
      toggle.textContent = 'Start'
    } else {
      started = Date.now()
      tick = setInterval(render, 1000)
      toggle.textContent = 'Pause'
    }
    render()
  })

  reset.addEventListener('click', () => {
    accumulated = 0
    started = started ? Date.now() : null
    render()
  })

  paint(0)
  render()
}
