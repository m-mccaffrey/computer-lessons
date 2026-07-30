/**
 * Sorting the course's props into "have already / buy / scrounge".
 *
 * This is a guess made from the wording of the prop, and it is deliberately a
 * visible guess: the three headings on /materials/ are there to make the *shape*
 * of the shopping obvious — that most of it is already in the house, that only
 * a few things cost money, and that a handful need months of asking around.
 *
 * Getting one wrong costs nothing. Getting the punch card wrong costs a lesson,
 * which is why anything historical or salvaged lands in `scrounge`.
 */
export type GroupKey = 'have' | 'buy' | 'scrounge'

export const GROUPS: Array<[GroupKey, string, string]> = [
  [
    'have',
    'Already in the house',
    'Household objects, paper, and the Pi 400s themselves. Nothing to acquire — just remember to have it on the table before they walk in.',
  ],
  [
    'buy',
    'Worth buying',
    'Small, cheap, and reliably available. The electronics for Unit 7 are the only real spend.',
  ],
  [
    'scrounge',
    'Start asking around now',
    'Dead hardware and obsolete media. These come from freecycle, work e-waste, a repair shop’s junk bin, or a relative’s garage, and they take months to turn up. Ask early; the lessons that need them are unteachable without them.',
  ],
]

/** Things that have to be found rather than bought. */
const SCROUNGE = [
  /\bdonor\b/i,
  /\btower\b/i,
  /punch\s*card/i,
  /floppy/i,
  /\bcd\b|\bdvd\b/i,
  /opened hard drive/i,
  /old\b.*\b(printer|cable)/i,
  /audience/i,
  /assorted cables/i,
  /\bfreecycle\b/i,
]

/** Things you buy, cheaply, from a shop that definitely has them. */
const BUY = [
  /breadboard/i,
  /jumper wire/i,
  /\bLEDs?\b/,
  /resistor/i,
  /\bGPIO\b/i,
  /anti-?static/i,
  /external drive/i,
  /USB stick/i,
  /\bSD card\b/i,
  /graph paper/i,
  /sticky note/i,
  /notebook/i,
  /power strip/i,
  /flip cards/i,
  /colou?red pencil/i,
]

export function classifyProp(prop: string): GroupKey {
  if (SCROUNGE.some((re) => re.test(prop))) return 'scrounge'
  if (BUY.some((re) => re.test(prop))) return 'buy'
  return 'have'
}
