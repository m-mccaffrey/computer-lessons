#!/usr/bin/env python3
"""Regenerate index.html from the lesson list below. Optional — index.html is
plain HTML and editing it by hand is fine.

    python3 gen_index.py

When you write a lesson, add its number to BUILT and re-run. Everything else
is listed but not linked.
"""

import html
from pathlib import Path

# Lessons that have an HTML file. Everything else is listed, greyed, unlinked.
BUILT = {1, 2, 9, 21}

UNITS = [
    (0, "What Is This Thing?",
     "Begins with 'a computer is the thing on the desk' and ends with them speccing "
     "and pricing a machine for a stated job."),
    (1, "Driving the Machine",
     "From 'where did my download go' to a filing system they designed and a "
     "repeatable procedure for when something breaks."),
    (2, "Making Things",
     "The three office tools, each attached to something they chose. Ends with a "
     "real talk given to a real audience."),
    (3, "Everything Is Numbers",
     "Every file they have made so far, re-explained as numbers. Ends with them "
     "compressing their own artwork by hand."),
    (4, "Fast, Slow, and Forever",
     "The mental model most adults never acquire. Ends with them diagnosing a slow "
     "machine and restoring a file they deleted on purpose."),
    (5, "The Command Line",
     "The same filesystem from Unit 1, now in text. Ends with a script that does "
     "something they actually want done."),
    (6, "The Internet",
     "From 'the internet is magic' to tracing a packet, reading a URL, and spotting "
     "a phish."),
    (7, "Making the Machine Do Something",
     "Enough programming to demystify it and to make Unit 3 concrete. Ends with code "
     "that moves atoms."),
    (8, "Capstone",
     "Something real, built and documented and demoed."),
]

# (number, unit, title, goal) — the goal is what the child can do afterwards.
#
# Unit 1 was originally 8 lessons: OS, Typing, Right-Click and Other Powers,
# The File System, Copy/Move/Delete, Icons Lie/Extensions Tell the Truth,
# Naming and Organizing, It's Broken. Four of those — mouse actions, the file
# system, copy/move/delete, and naming/organizing — turned out to be one
# lesson's worth of material rather than four, so they are merged into
# lesson 9, "Where Your Stuff Lives". Everything from old lesson 15 onward
# is renumbered down by 3 to close the gap (old 31 -> 28, old 35 -> 32, etc).
# If you are hunting for a lesson number mentioned in an older note and it
# does not exist, subtract 3 from anything that used to be 15 or higher.
LESSONS = [
    (1, 0, "What Is a Computer?", "Point at any object and say whether it is a computer, naming its input, output, and storage."),
    (2, 0, "Build the Four Boxes", "Draw the block diagram of any computer and point to each part on a real Pi 400."),
    (3, 0, "The Peripheral Zoo", "Name every common port and cable and match them by sight."),
    (4, 0, "Inside the Tower", "Identify PSU, motherboard, CPU, RAM, drive, and GPU in a real machine."),
    (5, 0, "Reading a Spec Sheet", "Read a real computer listing and say which numbers matter for a stated job."),
    (6, 0, "Build a Computer", "Spend a fixed budget on parts for a stated use case and defend every choice."),

    (7, 1, "What an Operating System Is", "Explain what sits between you and the hardware, and shut down properly without being told."),
    (8, 1, "Typing Bootcamp", "Find the home row without looking, and start a daily habit."),
    (9, 1, "Where Your Stuff Lives", "Use the mouse deliberately, navigate the folder tree, copy, move, rename, and delete files, and build a folder structure for school subjects three levels deep."),
    (10, 1, "Icons Lie, Extensions Tell the Truth", "Predict what will open a file from its extension, not its icon."),
    (11, 1, "It's Broken - Now What?", "Run the troubleshooting procedure on an unfamiliar failure without panicking."),

    (12, 2, "Plain Text and Word Processors", "Say what a word processor adds to plain text, and save vs save-as correctly."),
    (13, 2, "Headings Beat Bold", "Format a document with real headings instead of making text big."),
    (14, 2, "Long Documents", "Generate a table of contents, add page numbers, and find-and-replace across a document."),
    (15, 2, "Project: The Report", "Produce a two-page illustrated report with title page, contents, headings, and page numbers."),
    (16, 2, "Spreadsheets, Day One", "Say what a spreadsheet is for and enter data into a grid without fighting it."),
    (17, 2, "The Equals Sign", "Write a formula, use SUM and AVERAGE, and fill down."),
    (18, 2, "Sort, Filter, Chart", "Build a tracker for something they care about and chart it honestly."),
    (19, 2, "Slides Support the Talker", "Build a slide deck that helps them talk instead of replacing them."),
    (20, 2, "Present Day", "Give a three-minute talk with slides, and move a chart between three applications."),

    (21, 3, "Only Two Things", "Explain why a computer uses only 0 and 1, count to 31 in binary on one hand, and predict the output of NOT, AND, OR, NAND and NOR."),
    (22, 3, "Bits, Bytes, Gigabytes", "Estimate how many photos or songs fit on a given drive."),
    (23, 3, "Bitmaps", "Compute the file size of a picture from its dimensions, with a pencil."),
    (24, 3, "Color Is Three Numbers", "Predict a hex color code from an RGB mix, and read one in the wild."),
    (25, 3, "Letters Are Numbers Too", "Encode and decode a message by hand and explain why emoji needed a bigger scheme."),
    (26, 3, "Making It Smaller", "Compress their own pixel art by hand and say what lossy compression throws away."),
    (27, 3, "Formats Are Containers", "Choose the right format to send something, and say what a proprietary format costs you."),

    (28, 4, "The Desk and the Filing Cabinet", "Explain why unsaved work disappears when the power goes out."),
    (29, 4, "The Speed Pyramid", "Order the storage hierarchy by speed and say what cache is for."),
    (30, 4, "Why Is It Slow?", "Open a task manager, find the bottleneck, and name it."),
    (31, 4, "Physical Media", "Explain how three different media physically store a bit."),
    (32, 4, "From a Room to Your Wrist", "Put six generations of computer in order and say what got smaller and why it mattered."),
    (33, 4, "How You Lose Everything", "Set up a real backup and restore a file they deleted on purpose."),
    (34, 4, "The Cloud Is Someone Else's Computer", "Say the difference between sync, backup, and storage, and what happens offline."),

    (35, 5, "Why a Terminal Exists", "Navigate the filesystem in text and know where they are at all times."),
    (36, 5, "Making and Breaking", "Create, copy, move and delete from the command line, carefully."),
    (37, 5, "Reading and Writing", "Read a file, edit it, and check how much space things take."),
    (38, 5, "Small Tools, Combined", "Chain commands with a pipe to answer a question about their own file."),
    (39, 5, "Where Software Comes From", "Write a small script, install something with a package manager, and say why not to run a random download."),

    (40, 6, "Driving a Browser", "Read a URL like a sentence and use tabs, history, and print-to-PDF deliberately."),
    (41, 6, "What Happens When You Press Enter", "Trace the path from their keyboard to a server and back, out loud."),
    (42, 6, "Searching, and Believing", "Refine a search with operators and say who wrote a page and who paid for it."),
    (43, 6, "Why It's Free", "Explain how an ad-funded site makes money from their attention."),
    (44, 6, "Scams", "Spot a phishing attempt and explain the house rule about codes and money."),
    (45, 6, "Email and Footprints", "Send a proper email and say what is permanent and what is public."),

    (46, 7, "Telling It Exactly", "Build a program in Scratch with a loop that draws something."),
    (47, 7, "If, and Remembering", "Use a conditional and a variable to make a small game with a score."),
    (48, 7, "Python, in Words", "Write and run a program that asks a question and uses the answer."),
    (49, 7, "Deciding and Repeating", "Write a guessing game with hints that ends when it should."),
    (50, 7, "Doing It a Hundred Times", "Write a script that does a boring job to a whole folder at once."),
    (51, 7, "Code That Moves Atoms", "Blink an LED from a program, and change how it blinks."),

    (52, 8, "Pitch and Build", "Write a one-page spec for something real and start building it."),
    (53, 8, "Demo Night", "Demonstrate a finished thing to an audience, with written instructions someone else could follow."),
]

THESIS = (
    "A competent adult should be able to buy a computer, drive it, make documents "
    "with it, understand why it is slow, not lose their files, not get scammed, "
    "and not be afraid of it."
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
    w('<title>Computers — a course for two kids</title>')
    w('<link rel="stylesheet" href="style.css">')
    w('</head>')
    w('<body>')
    w('')
    w('<!-- Generated by gen_index.py. Editing by hand is fine; re-running overwrites. -->')
    w('')
    w('<main class="page">')
    w('  <h1>Computers</h1>')
    w(f'  <p class="thesis">{esc(THESIS)}</p>')
    w(f'  <p class="sub">{len(LESSONS)} lessons for a seven-year-old and a nine-year-old, taught')
    w('  at a kitchen table with two Raspberry Pi 400s. Not a computer science course.')
    w('  Not an engineering course.</p>')
    w('  <p class="sub">Each lesson is one page you scroll through together. Arrow keys move')
    w('  a slide at a time. Press <strong>N</strong> to stack the slides with the teacher')
    w('  notes underneath — that is how you read a lesson the night before.</p>')

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
    w('  </p>')
    w('</main>')
    w('')
    w('</body>')
    w('</html>')

    Path('index.html').write_text('\n'.join(out) + '\n', encoding='utf-8')
    print(f'index.html: {len(LESSONS)} lessons, {len(BUILT)} linked')


if __name__ == '__main__':
    main()
