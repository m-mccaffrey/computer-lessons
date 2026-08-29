# How these courses are built

Two courses live in this repository, built the same way:

- `/` — **Computers**, 53 lessons, for a seven-year-old and a nine-year-old.
- `/space/` — **Space**, 30 lessons, middle school level.

Each is a static site. No build step, no dependencies, no accounts. Open any
HTML file in a browser and it works.

## Files

```
style.css          every style for that course, one file
nav.js             arrow keys and the slide counter, nothing else
gen_index.py       regenerates index.html from the lesson table inside it
index.html         generated; editing by hand is fine
lessons/NN.html    one lesson, one file: slides plus its own widget code
notes/NN.html      the teacher cue sheet for that lesson (space course)
media/lNN/         images and diagrams for that lesson
```

To add a lesson: write `lessons/NN.html`, add `NN` to `BUILT` in
`gen_index.py`, re-run `python3 gen_index.py`.

## Slide rules

A lesson is a deck. One `<section class="slide">` per idea, each holding one
`<div class="frame">`. The frame is a fixed 16:9 box and everything inside it
is sized in `cqw`, so the same slide fits a monitor, a laptop and a phone in
landscape identically.

- **One idea per slide.** If the headline needs an "and", it is two slides.
- **Under 40 words visible.** Everything else is a teacher note.
- **The headline is a claim or a question, never a label.** Not "Orbits" —
  "Why doesn't it fall down?"
- **Ask before telling.** The question slide comes before the answer slide.
- **Nothing overflows the frame.** If it does not fit, split the slide.

Frame variants, all just a class on `.frame`: `center`, `activity` (graph
paper — they are about to be out of their chairs), `two-col`, `dark`,
`full-bleed`, and in the space course `demo`, which shrinks the headline and
hands the rest of the frame to a widget.

## A lesson is 45 minutes

That is the unit of scale. Not a topic — a sitting. A lesson takes one clear
question and answers it from several angles, and it usually swallows three or
four things that look like separate topics on a syllabus. Pluto is not a
lesson. "What else is out there besides planets?" is a lesson, and Pluto is
four minutes of it.

Every lesson names, at the top of its file, roughly where the break points
are, so a session can be cut short without cutting mid-idea.

## Widgets are the lesson

**Pack in as much interactivity as the lesson will hold.** Aim for a thing
they can click every two or three slides, and never go more than five slides
without one. The kids follow along on their own machines; a slide they can
only look at is a slide they are not in.

A widget is worth building when clicking it produces a result they could not
have predicted, or when it makes a wrong idea visibly fail. A widget that
just illustrates a sentence already on the slide is decoration — cut it and
write a better sentence.

Widgets go in a `<div class="applet">` inside the frame, with plain
JavaScript at the bottom of the lesson file. No libraries, ever. Canvas or
inline SVG for pictures. Keep each widget under about a hundred lines and
give it a comment saying which wrong idea it exists to break.

Every control is reachable by keyboard and every state is stated in text as
well as in colour — a lamp that is only "brighter" is no use to somebody who
cannot see the difference.

## Teacher notes are cues, not a script

In the computers course the notes are hidden `<div class="notes">` blocks in
the deck, revealed by pressing **N**.

In the space course they live on their own page, `notes/NN.html`, linked from
the bar in the corner of every lesson. Open it on a phone or a second window
while teaching.

The notes are **dry**. One line per beat, a few words each, in the plainest
language available. They exist to remind a teacher who has already read the
lesson what comes next — not to explain the material, not to entertain, and
not to be written well.

- Say what to say, in the fewest words: "air bends the light, not the star".
- Say what to watch for: "expect: they say stars are closer".
- Say what to do: "hand out the sheets", "let them click for two minutes".
- No jokes, no adjectives, no "cool", no "amazing", no framing.
- Numbers in the notes, never on the slide, unless the number is the point.
