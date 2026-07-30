/**
 * The deck engine (spec §7).
 *
 * Vanilla, no framework, no dependencies. Everything it does is either arrange
 * a scale factor or move an index; the slides themselves are static HTML that
 * renders correctly with this file absent, which is the point.
 */
import { openChannel } from './channel.js'

const CANVAS_W = 1280
const CANVAS_H = 720
const THUMB_SCALE = 240 / CANVAS_W

const root = document.querySelector('[data-deck]')
if (root) init(root)

function init(deck) {
  const stage = deck.querySelector('[data-stage]')
  const slides = [...deck.querySelectorAll('.slide')]
  if (!slides.length) return

  const params = new URLSearchParams(location.search)
  const isThumb = params.has('thumb')

  const announce = deck.querySelector('[data-announce]')
  const blackout = deck.querySelector('[data-blackout]')
  const help = deck.querySelector('[data-help]')
  const appletHint = deck.querySelector('[data-applet-hint]')
  const lesson = deck.dataset.lesson

  const state = {
    index: 0,
    /** How many <Beat>s on the current slide are revealed. */
    beat: 0,
    mode: 'present',
    blackout: false,
    /** True while focus is inside an applet: arrow keys belong to it, not us. */
    appletFocus: false,
  }

  deck.classList.add('deck--js')
  if (isThumb) deck.setAttribute('data-thumb', '')

  const channel = isThumb ? null : openChannel(onRemote)

  /* ------------------------------------------------------------- scaling --- */

  function rescale() {
    let scale
    if (state.mode === 'overview') {
      scale = THUMB_SCALE
    } else if (state.mode === 'read') {
      // Width-constrained rather than viewport-constrained, so the parent can
      // review a deck on a phone by scrolling it.
      const avail = Math.min(deck.clientWidth - 32, 1280)
      scale = Math.max(0.1, avail / CANVAS_W)
    } else {
      scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H)
    }
    deck.style.setProperty('--deck-scale', String(scale))
  }

  const ro = new ResizeObserver(rescale)
  ro.observe(deck)
  window.addEventListener('resize', rescale, { passive: true })

  /* --------------------------------------------------------------- beats --- */

  const beatsOf = (i) => [...slides[i].querySelectorAll('[data-beat]')]

  function setBeats(i, count) {
    beatsOf(i).forEach((el, k) => {
      if (k < count) el.setAttribute('data-shown', '')
      else el.removeAttribute('data-shown')
    })
  }

  /* -------------------------------------------------------------- moving --- */

  function show(i, { beat = 0, silent = false } = {}) {
    const clamped = Math.max(0, Math.min(slides.length - 1, i))
    state.index = clamped
    state.beat = Math.max(0, Math.min(beatsOf(clamped).length, beat))

    slides.forEach((s, k) => {
      if (k === clamped) s.setAttribute('data-active', '')
      else s.removeAttribute('data-active')
    })
    setBeats(clamped, state.beat)

    // The rail's fill is per-slide, but in present mode only one slide is on
    // screen, so the deck root carries the live value for anything outside it.
    deck.style.setProperty('--rail-progress', String((clamped + 1) / slides.length))

    if (!isThumb) {
      const hash = `#${clamped + 1}`
      if (location.hash !== hash) history.replaceState(null, '', hash)
    }

    if (announce && !silent) {
      announce.textContent = `Slide ${clamped + 1} of ${slides.length}`
    }

    if (state.mode !== 'present') {
      slides[clamped].scrollIntoView({ block: 'nearest', behavior: 'auto' })
    }

    if (!silent) broadcast()
  }

  function next() {
    const total = beatsOf(state.index).length
    if (state.beat < total) {
      state.beat += 1
      setBeats(state.index, state.beat)
      broadcast()
      return
    }
    if (state.index < slides.length - 1) show(state.index + 1)
  }

  function prev() {
    if (state.beat > 0) {
      state.beat -= 1
      setBeats(state.index, state.beat)
      broadcast()
      return
    }
    if (state.index > 0) {
      const target = state.index - 1
      show(target, { beat: beatsOf(target).length })
    }
  }

  /* --------------------------------------------------------------- modes --- */

  function setMode(mode) {
    state.mode = mode
    deck.setAttribute('data-mode', mode)
    const modeBtn = deck.querySelector('[data-act="mode"]')
    if (modeBtn) modeBtn.textContent = mode === 'present' ? 'Read' : 'Present'
    const ovBtn = deck.querySelector('[data-act="overview"]')
    if (ovBtn) ovBtn.setAttribute('aria-pressed', String(mode === 'overview'))
    rescale()
    if (mode !== 'present') {
      requestAnimationFrame(() => slides[state.index].scrollIntoView({ block: 'center' }))
    }
  }

  function toggleOverview() {
    setMode(state.mode === 'overview' ? 'present' : 'overview')
  }

  function togglePresentRead() {
    setMode(state.mode === 'read' ? 'present' : 'read')
  }

  function toggleBlackout() {
    state.blackout = !state.blackout
    blackout.hidden = !state.blackout
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else document.documentElement.requestFullscreen?.().catch(() => {})
  }

  function openPresenter() {
    const url = new URL(`presenter/`, location.href.split('#')[0].split('?')[0])
    window.open(url.href, 'deck-presenter', 'width=1100,height=760')
  }

  /* ------------------------------------------------------- applet focus --- */
  /* While focus is inside an applet the deck stops eating arrow keys, because
     half the applets in the catalog want them. Esc hands focus back. */

  function isInApplet(el) {
    return !!(el && el.closest && el.closest('[data-applet], .l-applet'))
  }

  deck.addEventListener('focusin', (e) => {
    const inside = isInApplet(e.target)
    if (inside === state.appletFocus) return
    state.appletFocus = inside
    if (appletHint) appletHint.hidden = !inside
  })

  deck.addEventListener('focusout', (e) => {
    if (!isInApplet(e.relatedTarget)) {
      state.appletFocus = false
      if (appletHint) appletHint.hidden = true
    }
  })

  /* ------------------------------------------------------------ keyboard --- */

  const NAV_KEYS = new Set([
    'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp',
    'PageDown', 'PageUp', 'Home', 'End', ' ',
  ])

  if (!isThumb) {
    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const target = e.target
      const typing =
        target instanceof HTMLElement &&
        (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      if (typing) return

      if (help?.open && e.key !== 'Escape' && e.key !== '?') return

      if (state.appletFocus) {
        if (e.key === 'Escape') {
          document.activeElement?.blur?.()
          deck.focus?.()
          state.appletFocus = false
          if (appletHint) appletHint.hidden = true
          e.preventDefault()
        }
        // Everything else belongs to the applet.
        if (NAV_KEYS.has(e.key)) return
      }

      switch (e.key) {
        case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ':
          if (state.appletFocus) return
          next(); e.preventDefault(); break
        case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
          if (state.appletFocus) return
          prev(); e.preventDefault(); break
        case 'Home': show(0); e.preventDefault(); break
        case 'End': show(slides.length - 1); e.preventDefault(); break
        case 'f': case 'F': toggleFullscreen(); break
        case 'o': case 'O': toggleOverview(); break
        case 'p': case 'P': togglePresentRead(); break
        case 's': case 'S': openPresenter(); break
        case 'b': case 'B': toggleBlackout(); e.preventDefault(); break
        case '?': help?.open ? help.close() : help?.showModal(); break
        case 'Escape':
          if (state.blackout) { toggleBlackout(); e.preventDefault() }
          else if (state.mode === 'overview') { setMode('present'); e.preventDefault() }
          break
      }
    })
  }

  /* -------------------------------------------------- pointer and touch --- */

  if (!isThumb) {
    deck.querySelectorAll('[data-zone]').forEach((zone) => {
      if (zone.dataset.zone === 'none') return
      zone.addEventListener('click', () => (zone.dataset.zone === 'next' ? next() : prev()))
    })

    // Blackout is a tap-anywhere-to-dismiss surface: with a room full of
    // attention on you, hunting for a key is not the moment you want.
    blackout?.addEventListener('click', toggleBlackout)

    deck.addEventListener('click', (e) => {
      const act = e.target.closest?.('[data-act]')?.dataset.act
      if (act) {
        ({
          next, prev,
          overview: toggleOverview,
          mode: togglePresentRead,
          presenter: openPresenter,
          fullscreen: toggleFullscreen,
          help: () => (help?.open ? help.close() : help?.showModal()),
          'close-help': () => help?.close(),
        })[act]?.()
        return
      }
      if (state.mode === 'overview') {
        const slide = e.target.closest?.('.slide')
        if (slide) {
          show(slides.indexOf(slide))
          setMode('present')
        }
      }
    })

    let touchX = null
    let touchY = null
    stage.addEventListener('touchstart', (e) => {
      touchX = e.changedTouches[0].clientX
      touchY = e.changedTouches[0].clientY
    }, { passive: true })
    stage.addEventListener('touchend', (e) => {
      if (touchX === null) return
      const dx = e.changedTouches[0].clientX - touchX
      const dy = e.changedTouches[0].clientY - touchY
      touchX = null
      if (state.mode !== 'present') return
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) dx < 0 ? next() : prev()
    }, { passive: true })
  }

  /* --------------------------------------------------------------- sync --- */

  function broadcast() {
    channel?.post({ lesson, index: state.index, beat: state.beat, from: 'deck' })
  }

  function onRemote(msg) {
    if (!msg || msg.lesson !== lesson || msg.from === 'deck') return
    show(msg.index, { beat: msg.beat, silent: true })
  }

  /* ------------------------------------------------------- dev overflow --- */
  /* Outline any slide whose content exceeds the 1280x720 canvas, and say which.
     Dev only — it is a authoring tool, not something to ship to a Pi. */

  if (import.meta.env.DEV && !isThumb) {
    requestAnimationFrame(() => {
      slides.forEach((slide, i) => {
        const content = slide.querySelector('.slide__content')
        if (!content) return
        const overflowsY = content.scrollHeight > content.clientHeight + 1
        const overflowsX = content.scrollWidth > content.clientWidth + 1
        if (overflowsY || overflowsX) {
          slide.setAttribute('data-overflow', '')
          console.warn(
            `[deck] slide ${i + 1} overflows the canvas ` +
              `(${content.scrollWidth}x${content.scrollHeight} in ${content.clientWidth}x${content.clientHeight}). ` +
              `Split it.`
          )
        }
      })
    })
  }

  /* ---------------------------------------------------------- start-up --- */

  const fromHash = Number.parseInt(location.hash.slice(1), 10)
  const startIndex = Number.isFinite(fromHash) ? fromHash - 1 : 0

  // Present on a laptop or a Pi at 1080p; read on a phone.
  setMode(isThumb ? 'present' : window.innerWidth >= 1024 ? 'present' : 'read')
  show(startIndex, { silent: true })
  rescale()

  window.addEventListener('hashchange', () => {
    const i = Number.parseInt(location.hash.slice(1), 10)
    if (Number.isFinite(i) && i - 1 !== state.index) show(i - 1)
  })

  // Scaling the whole deck on a slower machine is cheaper if we let the browser
  // settle first; one extra pass after fonts land avoids a reflow mid-sentence.
  document.fonts?.ready.then(rescale)
}
