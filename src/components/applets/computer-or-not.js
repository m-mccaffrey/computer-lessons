/**
 * <computer-or-not> — an object appears, two buttons, then the explanation.
 *
 * MISCONCEPTION THIS FIXES: that "computer" means "the desk-shaped thing with a
 * screen and a keyboard". Every object here is chosen to break one clause of
 * that sentence — the router has no screen, the abacus looks clever and isn't
 * one, the remote looks stupid and is. The explanation appears whichever button
 * is pressed, because the reasoning is the lesson and the verdict is not.
 *
 * No score. Deliberately: spec §11.8, and because a child who is keeping score
 * stops arguing, and the arguing is the point.
 */

const TAG = 'computer-or-not'

const OBJECTS = [
  {
    name: 'A microwave',
    is: true,
    why: 'Yes. Input: the buttons. Process: it decides when to stop. Output: heat, and the beep. Storage: the time, and the fact that you set it for ninety seconds.',
    kicker: 'After a power cut it blinks 12:00 — it forgot. That is worth remembering for lesson 31.',
  },
  {
    name: 'A book',
    is: false,
    why: 'No. It is storage, and nothing else. It holds information beautifully, for centuries, and it never once decides anything.',
    kicker: 'Storage alone is not enough. Process is the box that decides.',
  },
  {
    name: 'A TV remote',
    is: true,
    why: 'Yes. Its storage box is nearly empty and it is still a computer. It has to remember the blink pattern for every button, and it decides which one to send.',
    kicker: 'Point it at a phone camera in selfie mode and you can see the infrared LED flash.',
  },
  {
    name: 'An abacus',
    is: false,
    why: 'No — and this one is worth an argument. It stores numbers, but *you* are the processor. It never decides anything on its own.',
    kicker: 'Looking clever is not the test. Deciding is.',
  },
  {
    name: 'A traffic light',
    is: true,
    why: 'Yes. Input: the button, a wire loop buried in the road, a clock. Process: who goes, and never both green. Output: the lamps. Storage: the timing plan, and the fact that you pressed the button.',
    kicker: 'You press once and walk away, and ten seconds later it still knows.',
  },
  {
    name: 'A light switch',
    is: false,
    why: 'No. Your finger goes in, light comes out, and nothing in between decides anything or remembers anything.',
    kicker: 'The cleanest non-example there is.',
  },
  {
    name: 'A wind-up kitchen timer',
    is: false,
    why: 'No. It measures, which feels like thinking, but it never chooses. It does the same thing every time no matter what.',
    kicker: 'Measuring is not deciding.',
  },
  {
    name: 'A home router',
    is: true,
    why: 'Yes. No screen, no keyboard, no mouse — and it is making thousands of decisions a second about where to send things.',
    kicker: 'So "it has a screen" was never the test.',
  },
  {
    name: 'A hammer',
    is: false,
    why: 'No. Input: your arm. Output: a dent. No process, no storage.',
    kicker: 'Same for a chair, and for a bicycle.',
  },
  {
    name: 'A digital watch',
    is: true,
    why: 'Yes. Ask where its storage is and the answer is two things: the time right now, and the alarm you set last Tuesday.',
    kicker: 'Small does not mean simple.',
  },
]

const CSS = `
:host {
  display: block;
  container-type: inline-size;
  font-family: var(--font-slide, system-ui, sans-serif);
  color: var(--ink, #12171c);
}
* { box-sizing: border-box; }
.wrap { display: flex; flex-direction: column; gap: 16px; height: 100%; justify-content: center; }

.card {
  padding: 20px;
  background: var(--paper-2, #e2e7ec);
  border: 1px solid var(--grid, #d3dae1);
  border-radius: var(--radius-card, 2px);
}
.name { font-family: var(--font-display, system-ui); font-weight: 800; font-size: 32px; line-height: 1.1; margin: 0; }
@container (max-width: 520px) { .name { font-size: 24px; } }

.ask { display: flex; gap: 10px; flex-wrap: wrap; }
.ask button {
  flex: 1 1 140px;
  font-family: var(--font-mono, monospace); font-size: 16px;
  padding: 14px 18px;
  background: var(--paper, #edf0f3);
  border: 2px solid var(--ink-3, #7a868f);
  border-radius: var(--radius-card, 2px);
  color: var(--ink, #12171c);
  cursor: pointer;
}
.ask button:hover { border-color: var(--accent, #1b5ea8); color: var(--accent, #1b5ea8); }
.ask button:focus-visible { outline: 3px solid var(--focus, #0b63ce); outline-offset: 2px; }

.answer { display: flex; flex-direction: column; gap: 10px; }
.verdict { font-family: var(--font-mono, monospace); font-size: 14px; letter-spacing: .08em; text-transform: uppercase; color: var(--accent, #1b5ea8); margin: 0; }
.why { font-size: 17px; line-height: 1.45; margin: 0; }
.kicker { font-size: 15px; line-height: 1.45; color: var(--ink-2, #444f59); margin: 0; padding-left: 12px; border-left: 2px solid var(--accent, #1b5ea8); }

.bar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.bar button {
  font-family: var(--font-mono, monospace); font-size: 13px;
  padding: 8px 14px;
  background: var(--paper-2, #e2e7ec);
  border: 1px solid var(--grid, #d3dae1);
  border-radius: var(--radius-card, 2px);
  color: var(--ink-2, #444f59);
  cursor: pointer;
}
.bar button:hover { border-color: var(--accent, #1b5ea8); color: var(--accent, #1b5ea8); }
.bar p { font-family: var(--font-mono, monospace); font-size: 13px; color: var(--ink-3, #7a868f); margin: 0 0 0 auto; }
`

class ComputerOrNot extends HTMLElement {
  #order = []
  #at = 0
  #answered = false

  connectedCallback() {
    if (this.shadowRoot) return
    this.attachShadow({ mode: 'open' })
    this.#order = OBJECTS.map((_, i) => i)
    if (this.getAttribute('order') !== 'fixed') shuffle(this.#order)
    this.#render()
  }

  reset() {
    this.#at = 0
    this.#answered = false
    if (this.getAttribute('order') !== 'fixed') shuffle(this.#order)
    this.#render()
  }

  #current() {
    return OBJECTS[this.#order[this.#at % this.#order.length]]
  }

  #render() {
    const o = this.#current()
    this.shadowRoot.innerHTML = `
      <style>${CSS}</style>
      <div class="wrap">
        <div class="card">
          <p class="name">${o.name}</p>
        </div>
        ${
          this.#answered
            ? `<div class="answer">
                 <p class="verdict">${o.is ? 'It is a computer' : 'Not a computer'}</p>
                 <p class="why">${o.why}</p>
                 <p class="kicker">${o.kicker}</p>
               </div>`
            : `<div class="ask">
                 <button type="button" data-act="yes">Computer</button>
                 <button type="button" data-act="no">Not a computer</button>
               </div>`
        }
        <div class="bar">
          ${this.#answered ? '<button type="button" data-act="next">Next object</button>' : ''}
          <button type="button" data-act="reset">Reset</button>
          <p>${this.#at + 1} of ${this.#order.length}</p>
        </div>
      </div>
    `

    this.shadowRoot.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act
      if (!act) return
      if (act === 'yes' || act === 'no') {
        // Both buttons do the same thing. There is no score to keep.
        this.#answered = true
        this.#render()
      }
      if (act === 'next') {
        this.#at = (this.#at + 1) % this.#order.length
        this.#answered = false
        this.#render()
      }
      if (act === 'reset') this.reset()
    })
  }
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, ComputerOrNot)
