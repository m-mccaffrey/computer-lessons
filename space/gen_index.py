#!/usr/bin/env python3
"""Regenerate space/index.html from the lesson list below. Optional —
index.html is plain HTML and editing it by hand is fine.

    python3 gen_index.py

When you write a lesson, add its number to BUILT and re-run. Everything else
is listed but not linked.
"""

import html
from pathlib import Path

# Lessons that have an HTML file. Everything else is listed, greyed, unlinked.
BUILT = {1}

UNITS = [
    (0, "Looking Up",
     "Starts with a light in the sky they cannot name and ends with them "
     "knowing what they are looking at, which way it is moving, and how "
     "hopelessly far away it is."),
    (1, "Gravity and Orbits",
     "The one piece of physics the rest of the course leans on. Ends with "
     "them able to say why a satellite does not fall down and why an "
     "astronaut floats."),
    (2, "Sun, Earth, Moon",
     "The three-body clockwork responsible for day, year, season, phase, "
     "eclipse and tide. Everything here is predictable from geometry."),
    (3, "The Solar System",
     "A tour with a thesis: distance from the Sun explains almost "
     "everything about what a world turned out to be."),
    (4, "Light and Stars",
     "Light is the only thing that ever reaches us, so this unit is about "
     "reading it. Ends with them getting a star's temperature, ingredients "
     "and fate out of its colour."),
    (5, "The Universe",
     "Zooming out past the last thing with a name. Ends with an honest "
     "account of what is known, what is measured, and what is still dark."),
    (6, "Getting There",
     "How you actually leave, where you can go, and what it takes to stay "
     "alive once you have. Numbers, budgets and trade-offs."),
    (7, "People, Probes and Questions",
     "How this was all worked out, mostly by people with worse equipment "
     "than a phone, and the question nobody has answered."),
    (8, "Capstone",
     "Design something, observe something, and present both."),
]

# (number, unit, title, goal) — the goal is what the kid can do afterwards.
#
# A lesson is 45 minutes, not a topic. Several syllabus bullets go into each
# one; see DESIGN.md in the repository root. If a lesson below looks like it
# is carrying four things, that is deliberate.
LESSONS = [
    (1, 0, "What Is That Light?",
     "Look at anything in the night sky and say whether it is a star, a planet, a "
     "satellite, a plane or a meteor, and give the reason."),
    (2, 0, "The Sky Turns",
     "Explain the night's motion and the year's changing constellations without "
     "saying that the stars move, and find north from the sky."),
    (3, 0, "How Far Is Far?",
     "Build the solar system to scale, put the Sun, Pluto and the nearest star in "
     "proportion, and say what it means that everything they see is old light."),

    (4, 1, "Everything Falls",
     "Predict which of two dropped objects lands first and why, and compute their "
     "own weight on any world from its mass and radius."),
    (5, 1, "Falling and Missing",
     "Explain an orbit as falling sideways fast enough to miss, and say why low "
     "orbits are fast, high orbits are slow, and escape is neither."),
    (6, 1, "Why Astronauts Float",
     "Explain weightlessness without using the phrase 'no gravity', and say what "
     "is actually different inside a falling box."),
    (7, 1, "Orbits Are Not Circles",
     "Draw an ellipse, say where an orbiting thing speeds up and why, and explain "
     "why a comet is only visible for a few weeks."),

    (8, 2, "Why There Are Seasons",
     "Kill the 'summer is closer to the Sun' idea with evidence, and predict day "
     "length and sun angle for any date and latitude."),
    (9, 2, "The Moon's Phases",
     "Predict the Moon's phase from the Sun-Earth-Moon geometry, say what time it "
     "rises, and explain why we only ever see one side."),
    (10, 2, "Eclipses and Tides",
     "Explain why there is not an eclipse every month, and why there are two high "
     "tides a day rather than one."),

    (11, 3, "The Sun Is the Whole Story",
     "State the Sun's share of the solar system's mass, describe fusion in a "
     "sentence, and connect a sunspot to an aurora."),
    (12, 3, "Rock, Air and Greenhouse",
     "Compare the four rocky planets on four numbers and explain why Venus is "
     "hotter than Mercury."),
    (13, 3, "Giants, Moons and Rings",
     "Say why the outer planets are big and gassy, why rings sit where they do, "
     "and why the missions go to moons rather than planets."),
    (14, 3, "Rubble and Ice",
     "Use asteroid, meteor, meteorite and comet correctly, estimate an impact, and "
     "argue a side on whether Pluto is a planet."),

    (15, 4, "Light Is the Only Messenger",
     "Order the spectrum by energy, say what each kind of telescope is for, and "
     "explain why a bigger mirror is a better one."),
    (16, 4, "Reading a Star",
     "Get temperature from colour, ingredients from spectral lines, and motion "
     "from a shift, and separate brightness from luminosity."),
    (17, 4, "How Stars Live",
     "Place a star on the H-R diagram from its colour and brightness, and predict "
     "its whole life from one number: its mass."),
    (18, 4, "How Stars Die",
     "Say what a star of a given mass leaves behind, explain an event horizon "
     "without magic, and trace an atom in their own body to a star."),

    (19, 5, "The Milky Way From Inside",
     "Explain why the galaxy looks like a band, say where we sit in it, and give "
     "the scale of it in time as well as distance."),
    (20, 5, "Galaxies and the Great Rush",
     "Classify a galaxy by shape and explain expansion without putting a centre "
     "anywhere, including here."),
    (21, 5, "The Beginning and the Dark",
     "Say what the leftover glow is and why it counts as evidence, and state "
     "plainly what dark matter and dark energy are and are not."),

    (22, 6, "How Rockets Work",
     "Explain thrust with nothing to push against, and say from the numbers why a "
     "rocket is almost entirely fuel and has to be thrown away in stages."),
    (23, 6, "Up, and Back Down",
     "Explain why going to space is mostly sideways, and why coming back is hot "
     "for a reason that is not friction."),
    (24, 6, "Going Somewhere Else",
     "Plan a transfer to Mars, say why the window comes round every 26 months, "
     "and use a planet to steal speed."),
    (25, 6, "Staying Alive Out There",
     "List what a spacesuit and a spacecraft must each do, and say which of them "
     "is hardest for a three-year trip."),

    (26, 7, "How We Worked It Out",
     "Measure the Earth with a stick and a shadow, and give the evidence that "
     "settled the argument about what goes round what."),
    (27, 7, "The Space Age",
     "Put the first sixty years of spaceflight in order and say what was driving "
     "each stretch of it."),
    (28, 7, "Are We Alone?",
     "Find a planet by watching a star dim, define a habitable zone, and use the "
     "Drake equation honestly rather than to get an answer they like."),

    (29, 8, "Design a Mission",
     "Write a one-page mission proposal: destination, question, instruments, mass "
     "budget and launch window, all defensible."),
    (30, 8, "Observation Night",
     "Log a real night's observing and present what they saw, what they expected, "
     "and what did not match."),
]

THESIS = (
    "A person should be able to walk outside, look up, and know what they are "
    "seeing; explain why things orbit instead of falling; say honestly how big "
    "and how old the universe is; know how we got off this planet; and tell a "
    "real result from a headline."
)


def esc(s):
    return html.escape(s, quote=False)


def main():
    out = []
    w = out.append

    w('<!doctype html>')
    w('<html lang="en">')
    w('<head>')
    w('<meta charset="utf-8">')
    w('<meta name="viewport" content="width=device-width, initial-scale=1">')
    w('<title>Space — a course for two kids</title>')
    w('<link rel="stylesheet" href="style.css">')
    w('</head>')
    w('<body>')
    w('')
    w('<!-- Generated by gen_index.py. Editing by hand is fine; re-running overwrites. -->')
    w('')
    w('<main class="page">')
    w('  <h1>Space</h1>')
    w(f'  <p class="thesis">{esc(THESIS)}</p>')
    w(f'  <p class="sub">{len(LESSONS)} lessons at middle school level, taught at a kitchen')
    w('  table with everyone on their own screen. Each lesson is 45 minutes and is built')
    w('  around things you click, not things you watch.</p>')
    w('  <p class="sub">Each lesson is one page you scroll through together. Arrow keys move')
    w('  a slide at a time. The <strong>Notes</strong> link in the corner of every lesson')
    w('  opens the teacher cue sheet — beat by beat, one line each. Open it on a phone.</p>')

    for n, title, arc in UNITS:
        lessons = [l for l in LESSONS if l[1] == n]
        if not lessons:
            continue
        w('')
        w(f'  <section class="unit" data-unit="{n}">')
        w(f'    <h2>{n}. {esc(title)}</h2>')
        w(f'    <p class="arc">{esc(arc)}</p>')
        w('    <ul class="lessons">')
        for num, _unit, lt, goal in lessons:
            built = num in BUILT
            cls = '' if built else ' class="todo"'
            w(f'      <li{cls}>')
            w(f'        <span class="n">{num:02d}</span>')
            w('        <div>')
            if built:
                w(f'          <a class="title" href="lessons/{num:02d}.html">{esc(lt)}</a>')
            else:
                w(f'          <span class="title">{esc(lt)}</span>')
            w(f'          <p class="goal">{esc(goal)}</p>')
            w('        </div>')
            w('      </li>')
        w('    </ul>')
        w('  </section>')

    w('')
    w('  <p class="foot">')
    w(f'    {len(BUILT)} of {len(LESSONS)} lessons written. No accounts, no analytics,')
    w('    nothing tracked. Open any file in a browser — there is nothing to build.')
    w('    The <a href="../index.html">computers course</a> is next door.')
    w('  </p>')
    w('</main>')
    w('')
    w('</body>')
    w('</html>')

    Path(__file__).with_name('index.html').write_text('\n'.join(out) + '\n', encoding='utf-8')
    print(f'index.html: {len(LESSONS)} lessons, {len(BUILT)} linked')


if __name__ == '__main__':
    main()
