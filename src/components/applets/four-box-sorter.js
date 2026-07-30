/**
 * <four-box-sorter> — drag household objects into INPUT / PROCESS / OUTPUT / STORAGE.
 *
 * MISCONCEPTION THIS FIXES: that a computer's four boxes are parts you can point
 * at, one per object. They are *roles*. The same microwave is doing all four at
 * once, and a book is doing exactly one. Sorting objects by role rather than by
 * appearance is the whole of lesson 1, and the box children hesitate on is
 * almost always storage — which this makes visible to the parent immediately.
 *
 * No score, no timer, no failure state. A wrong answer is a conversation, and
 * the applet's job is to hold the pieces still while that conversation happens.
 */

const TAG = 'four-box-sorter'

const BOXES = [
  ['input', 'INPUT', 'how it finds things out'],
  ['process', 'PROCESS', 'where it decides what to do'],
  ['output', 'OUTPUT', 'how it tells you, or changes something'],
  ['storage', 'STORAGE', 'where it keeps things'],
]

/* The objects are lesson 1's, and each carries the answer the guide gives so a
   child working alone still gets the reasoning rather than a tick. */
const DEFAULT_ITEMS = [
  { id: 'button', label: 'a button you press', box: 'input', why: 'It is how the machine finds out you are there.' },
  { id: 'coin-slot', label: 'a coin slot', box: 'input', why: 'Money going in is information going in.' },
  { id: 'thermometer', label: 'a thermometer inside a thermostat', box: 'input', why: 'Its input is not a person at all. It is the temperature.' },
  { id: 'decide-green', label: 'deciding who gets a green light', box: 'process', why: 'Deciding is the box that makes it a computer.' },
  { id: 'check-paid', label: 'checking whether you paid enough', box: 'process', why: 'A comparison, then a decision. That is processing.' },
  { id: 'lamp', label: 'the red and green lamps', box: 'output', why: 'Output is how it tells you, or changes something in the world.' },
  { id: 'snack', label: 'the snack dropping down', box: 'output', why: 'Output does not have to be a screen.' },
  { id: 'screen', label: 'a screen', box: 'output', why: 'The most obvious output, and the least interesting one.' },
  { id: 'codes', label: 'the list of button codes in a remote', box: 'storage', why: 'It has to remember how to do its job, even unplugged.' },
  { id: 'timing-plan', label: 'a traffic light’s timing plan', box: 'storage', why: 'Written down inside, and still there after a power cut.' },
  { id: 'pressed', label: 'the fact that you pressed the button', box: 'storage', why: 'You press once and walk away, and ten seconds later it still knows. That is storage.' },
  { id: 'snacks', label: 'the snacks in the machine', box: 'storage', why: 'It keeps them until they are asked for.' },
]

const CSS = `
:host {
  display: block;
  container-type: inline-size;
  font-family: var(--font-slide, system-ui, sans-serif);
  color: var(--ink, #12171c);
  --gap: 12px;
}
* { box-sizing: border-box; }
.wrap { display: flex; flex-direction: column; gap: var(--gap); height: 100%; }

.tray {
  display: flex; flex-wrap: wrap; gap: 8px;
  padding: 10px;
  background: var(--paper-2, #e2e7ec);
  border: 1px solid var(--grid, #d3dae1);
  border-radius: var(--radius-card, 2px);
  min-height: 64px;
  align-content: flex-start;
}
.tray[data-empty]::after {
  content: 'All sorted. Press reset to go again.';
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  color: var(--ink-3, #7a868f);
}

.boxes { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--gap); flex: 1; min-height: 0; }
@container (max-width: 640px) { .boxes { grid-template-columns: repeat(2, 1fr); } }

.box {
  display: flex; flex-direction: column; gap: 6px;
  padding: 10px;
  background: var(--paper, #edf0f3);
  border: 1px solid var(--grid, #d3dae1);
  border-radius: var(--radius-card, 2px);
  min-height: 0;
}
.box[data-over] { border-color: var(--accent, #1b5ea8); background: var(--paper-2, #e2e7ec); }
.box__name { font-family: var(--font-mono, monospace); font-size: 14px; font-weight: 600; letter-spacing: .08em; margin: 0; }
.box__hint { font-size: 12px; line-height: 1.3; color: var(--ink-3, #7a868f); margin: 0 0 4px; }
.box__drop { display: flex; flex-direction: column; gap: 6px; flex: 1; min-height: 40px; }

.chip {
  display: block; width: 100%; text-align: left;
  font: inherit; font-size: 14px; line-height: 1.25;
  padding: 8px 10px;
  background: var(--paper, #edf0f3);
  border: 1px solid var(--ink-3, #7a868f);
  border-radius: var(--radius-card, 2px);
  color: inherit;
  cursor: grab;
}
.tray .chip { width: auto; background: var(--paper, #edf0f3); }
.chip:focus-visible { outline: 3px solid var(--focus, #0b63ce); outline-offset: 2px; }
.chip[data-dragging] { opacity: .4; }
.chip[data-placed] { border-color: var(--grid, #d3dae1); cursor: pointer; }
.chip[data-verdict='right'] { border-left: 4px solid var(--accent, #1f7a3d); }
.chip[data-verdict='rethink'] { border-left: 4px dashed var(--ink-3, #7a868f); }
.chip small { display: block; margin-top: 4px; font-size: 12px; line-height: 1.35; color: var(--ink-2, #444f59); }

.bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.bar button {
  font-family: var(--font-mono, monospace); font-size: 13px;
  padding: 7px 12px;
  background: var(--paper-2, #e2e7ec);
  border: 1px solid var(--grid, #d3dae1);
  border-radius: var(--radius-card, 2px);
  color: var(--ink-2, #444f59);
  cursor: pointer;
}
.bar button:hover { border-color: var(--accent, #1b5ea8); color: var(--accent, #1b5ea8); }
.bar p { font-family: var(--font-mono, monospace); font-size: 13px; color: var(--ink-3, #7a868f); margin: 0 0 0 auto; }

@media (prefers-reduced-motion: no-preference) {
  .chip { transition: border-color 120ms ease; }
}
`

class FourBoxSorter extends HTMLElement {
  #items = []
  #selected = null
  #showWhy = false

  connectedCallback() {
    if (this.shadowRoot) return
    this.attachShadow({ mode: 'open' })
    this.#items = DEFAULT_ITEMS.map((i) => ({ ...i, placed: null }))
    this.#render()
  }

  reset() {
    this.#items = this.#items.map((i) => ({ ...i, placed: null }))
    this.#selected = null
    this.#showWhy = false
    this.#render()
  }

  #render() {
    const root = this.shadowRoot
    const unplaced = this.#items.filter((i) => !i.placed)

    root.innerHTML = `
      <style>${CSS}</style>
      <div class="wrap">
        <div class="tray" part="tray" ${unplaced.length ? '' : 'data-empty'} role="list"
             aria-label="Objects waiting to be sorted"></div>
        <div class="boxes"></div>
        <div class="bar">
          <button type="button" data-act="reset">Reset</button>
          <button type="button" data-act="why" aria-pressed="${this.#showWhy}">
            ${this.#showWhy ? 'Hide the reasons' : 'Show the reasons'}
          </button>
          <p>${this.#items.length - unplaced.length} of ${this.#items.length} placed</p>
        </div>
      </div>
    `

    const tray = root.querySelector('.tray')
    for (const item of unplaced) tray.append(this.#chip(item))

    const boxes = root.querySelector('.boxes')
    for (const [id, name, hint] of BOXES) {
      const box = document.createElement('div')
      box.className = 'box'
      box.dataset.box = id
      box.innerHTML = `
        <p class="box__name">${name}</p>
        <p class="box__hint">${hint}</p>
        <div class="box__drop" role="list" aria-label="${name}"></div>
      `
      const drop = box.querySelector('.box__drop')
      for (const item of this.#items.filter((i) => i.placed === id)) drop.append(this.#chip(item))
      boxes.append(box)
    }

    this.#wire()
  }

  #chip(item) {
    const el = document.createElement('button')
    el.type = 'button'
    el.className = 'chip'
    el.draggable = true
    el.dataset.id = item.id
    el.setAttribute('role', 'listitem')
    if (item.placed) {
      el.dataset.placed = ''
      // "rethink", never "wrong". The point is to reopen the question, not to mark it.
      el.dataset.verdict = item.placed === item.box ? 'right' : 'rethink'
    }
    el.innerHTML =
      item.label + (this.#showWhy && item.placed ? `<small>${item.why}</small>` : '')
    if (this.#selected === item.id) el.setAttribute('aria-pressed', 'true')
    return el
  }

  #wire() {
    const root = this.shadowRoot

    root.querySelector('.bar').addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act
      if (act === 'reset') this.reset()
      if (act === 'why') {
        this.#showWhy = !this.#showWhy
        this.#render()
      }
    })

    /* ---- pointer: drag and drop ---- */
    root.addEventListener('dragstart', (e) => {
      const chip = e.target.closest('.chip')
      if (!chip) return
      e.dataTransfer.setData('text/plain', chip.dataset.id)
      e.dataTransfer.effectAllowed = 'move'
      chip.dataset.dragging = ''
    })

    root.addEventListener('dragend', (e) => {
      e.target.closest('.chip')?.removeAttribute('data-dragging')
    })

    for (const target of root.querySelectorAll('.box, .tray')) {
      target.addEventListener('dragover', (e) => {
        e.preventDefault()
        target.closest('.box')?.setAttribute('data-over', '')
      })
      target.addEventListener('dragleave', () => target.closest('.box')?.removeAttribute('data-over'))
      target.addEventListener('drop', (e) => {
        e.preventDefault()
        this.#place(e.dataTransfer.getData('text/plain'), target.dataset.box ?? null)
      })
    }

    /* ---- keyboard: pick up, then choose a box ----
       Drag and drop is unusable from a keyboard, and one of the two children is
       seven. Click or Enter picks a chip up; clicking a box puts it down. */
    root.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip')
      if (chip) {
        this.#selected = this.#selected === chip.dataset.id ? null : chip.dataset.id
        this.#render()
        this.shadowRoot.querySelector(`.chip[data-id="${this.#selected}"]`)?.focus()
        return
      }
      const box = e.target.closest('.box')
      if (box && this.#selected) this.#place(this.#selected, box.dataset.box)
    })
  }

  #place(id, box) {
    const item = this.#items.find((i) => i.id === id)
    if (!item) return
    item.placed = box
    this.#selected = null
    this.#render()
    this.dispatchEvent(new CustomEvent('place', { detail: { id, box }, bubbles: true }))
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, FourBoxSorter)
