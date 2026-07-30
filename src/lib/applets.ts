/**
 * The applet catalog (spec §12).
 *
 * Every applet the course calls for, whether or not it is built yet. Listing the
 * unbuilt ones is deliberate: /applets/ is the page that says what the course
 * still needs, and a lesson whose applet does not exist should say so on the
 * page rather than render an empty box.
 *
 * `misconception` is the question spec §11 requires every applet to answer:
 * what does this fix? An applet that cannot answer it is decoration, and should
 * be cut rather than listed here.
 */
export interface Applet {
  tag: string
  title: string
  unit: number
  lessons: number[]
  /** What this fixes. If you cannot fill this in, do not build it. */
  misconception: string
  /** Spec §12 stars the load-bearing ones. */
  loadBearing?: boolean
  built: boolean
}

export const APPLETS: Applet[] = [
  // ---- Unit 0 -------------------------------------------------------------
  {
    tag: 'four-box-sorter',
    title: 'Four-box sorter',
    unit: 0,
    lessons: [1],
    misconception: 'That the four boxes are parts you can point at, rather than roles the same object plays at once.',
    built: true,
  },
  {
    tag: 'computer-or-not',
    title: 'Computer or not?',
    unit: 0,
    lessons: [1],
    misconception: 'That "computer" means the desk-shaped thing with a screen and a keyboard.',
    built: true,
  },
  {
    tag: 'block-diagram',
    title: 'The five boxes',
    unit: 0,
    lessons: [2, 31, 32],
    misconception: 'That the parts of a machine are a list rather than a set of things that need each other.',
    loadBearing: true,
    built: false,
  },
  {
    tag: 'port-match',
    title: 'Port match',
    unit: 0,
    lessons: [3],
    misconception: 'That cables are interchangeable and the shape is decoration.',
    built: false,
  },
  {
    tag: 'spec-decoder',
    title: 'Spec decoder',
    unit: 0,
    lessons: [5],
    misconception: 'That a bigger number on a spec sheet is always the better machine.',
    built: false,
  },
  {
    tag: 'parts-picker',
    title: 'Parts picker',
    unit: 0,
    lessons: [6],
    misconception: 'That parts are chosen one at a time rather than against a budget and each other.',
    loadBearing: true,
    built: false,
  },

  // ---- Unit 1 -------------------------------------------------------------
  {
    tag: 'file-tree',
    title: 'File tree',
    unit: 1,
    lessons: [10, 11, 13],
    misconception: 'That files live "in the program that opens them" rather than in a place you can name.',
    loadBearing: true,
    built: false,
  },
  {
    tag: 'copy-vs-move',
    title: 'Copy vs move',
    unit: 1,
    lessons: [11],
    misconception: 'That copying and moving are the same gesture with different results by luck.',
    built: false,
  },
  {
    tag: 'extension-truth',
    title: 'Icons lie',
    unit: 1,
    lessons: [12],
    misconception: 'That the icon tells you what a file is.',
    built: false,
  },
  {
    tag: 'error-message',
    title: 'Reading an error',
    unit: 1,
    lessons: [14],
    misconception: 'That an error message is noise to be dismissed rather than a sentence to be read.',
    built: false,
  },

  // ---- Unit 2 -------------------------------------------------------------
  {
    tag: 'structure-vs-style',
    title: 'Structure vs style',
    unit: 2,
    lessons: [16, 17],
    misconception: 'That making text big and bold is the same as making it a heading.',
    loadBearing: true,
    built: false,
  },
  {
    tag: 'fill-down',
    title: 'Fill down',
    unit: 2,
    lessons: [20],
    misconception: 'That a formula is a number rather than an instruction that moves.',
    built: false,
  },
  {
    tag: 'chart-lies',
    title: 'Charts can lie',
    unit: 2,
    lessons: [21],
    misconception: 'That a chart shows the data rather than a choice about the data.',
    built: false,
  },

  // ---- Unit 3 -------------------------------------------------------------
  {
    tag: 'bit-switches',
    title: 'Eight switches',
    unit: 3,
    lessons: [24],
    misconception: 'That binary is a code computers use, rather than just counting with two digits.',
    loadBearing: true,
    built: false,
  },
  {
    tag: 'size-estimator',
    title: 'Filling a drive',
    unit: 3,
    lessons: [25],
    misconception: 'That file sizes are abstract and a gigabyte is just "a lot".',
    built: false,
  },
  {
    tag: 'pixel-canvas',
    title: 'Pixel canvas',
    unit: 3,
    lessons: [26],
    misconception: 'That a picture is a picture, rather than a grid of numbers whose size you can compute.',
    loadBearing: true,
    built: false,
  },
  {
    tag: 'zoom-to-pixels',
    title: 'Zoom to pixels',
    unit: 3,
    lessons: [26],
    misconception: 'That photographs are continuous.',
    built: false,
  },
  {
    tag: 'hex-mixer',
    title: 'Hex mixer',
    unit: 3,
    lessons: [27],
    misconception: 'That a hex colour code is a magic word rather than three numbers.',
    loadBearing: true,
    built: false,
  },
  {
    tag: 'ascii-table',
    title: 'Letters are numbers',
    unit: 3,
    lessons: [28],
    misconception: 'That text is a different kind of thing from numbers.',
    built: false,
  },
  {
    tag: 'caesar-wheel',
    title: 'Caesar wheel',
    unit: 3,
    lessons: [28, 47],
    misconception: 'That a secret code is unbreakable because you cannot read it.',
    built: false,
  },
  {
    tag: 'rle-compressor',
    title: 'Run-length encoder',
    unit: 3,
    lessons: [29],
    misconception: 'That compression is magic rather than noticing repetition.',
    loadBearing: true,
    built: false,
  },
  {
    tag: 'lossy-slider',
    title: 'Lossy slider',
    unit: 3,
    lessons: [29],
    misconception: 'That making a file smaller is free.',
    built: false,
  },

  // ---- Unit 4 -------------------------------------------------------------
  {
    tag: 'volatile-demo',
    title: 'Power cut',
    unit: 4,
    lessons: [31],
    misconception: 'That everything on the screen is already saved.',
    built: false,
  },
  {
    tag: 'memory-pyramid',
    title: 'The speed pyramid',
    unit: 4,
    lessons: [32],
    misconception: 'That "fast" and "slow" inside a computer are small differences. Scaled to human time, they are seconds against years.',
    loadBearing: true,
    built: false,
  },
  {
    tag: 'bottleneck-sim',
    title: 'Bottleneck',
    unit: 4,
    lessons: [33],
    misconception: 'That a slow computer is slow all over, rather than waiting on one thing.',
    built: false,
  },
  {
    tag: 'media-timeline',
    title: 'Media timeline',
    unit: 4,
    lessons: [34],
    misconception: 'That storage has always been cheap.',
    loadBearing: true,
    built: false,
  },
  {
    tag: 'size-of-computers',
    title: 'Room to wrist',
    unit: 4,
    lessons: [35],
    misconception: 'That computers have always been about this size.',
    built: false,
  },

  // ---- Unit 5 -------------------------------------------------------------
  {
    tag: 'terminal-sandbox',
    title: 'Terminal sandbox',
    unit: 5,
    lessons: [38, 39, 40, 41, 42],
    misconception: 'That the command line is a different computer from the one with the icons. It is the same filesystem, in text.',
    loadBearing: true,
    built: false,
  },

  // ---- Unit 6 -------------------------------------------------------------
  {
    tag: 'url-anatomy',
    title: 'Anatomy of a URL',
    unit: 6,
    lessons: [43, 47],
    misconception: 'That you can tell which site you are on by reading the words in the address left to right.',
    loadBearing: true,
    built: false,
  },
  {
    tag: 'packet-journey',
    title: 'Packet journey',
    unit: 6,
    lessons: [44],
    misconception: 'That a message travels as one piece down one wire.',
    built: false,
  },
  {
    tag: 'search-refiner',
    title: 'Search refiner',
    unit: 6,
    lessons: [45],
    misconception: 'That a search box takes questions rather than queries.',
    built: false,
  },
  {
    tag: 'phish-or-not',
    title: 'Phish or not',
    unit: 6,
    lessons: [47],
    misconception: 'That a scam looks obviously like a scam.',
    loadBearing: true,
    built: false,
  },
  {
    tag: 'password-strength',
    title: 'How long to crack',
    unit: 6,
    lessons: [47],
    misconception: 'That a password with a symbol in it is a strong password.',
    built: false,
  },

  // ---- Unit 7 -------------------------------------------------------------
  {
    tag: 'python-trace',
    title: 'Python trace',
    unit: 7,
    lessons: [51, 52, 53],
    misconception: 'That a program happens all at once, rather than one line at a time with boxes changing.',
    built: false,
  },
  {
    tag: 'gpio-sim',
    title: 'Breadboard simulator',
    unit: 7,
    lessons: [54],
    misconception: 'That code and the physical world are separate.',
    built: false,
  },
]

export const appletByTag = new Map(APPLETS.map((a) => [a.tag, a]))

export const builtApplets = APPLETS.filter((a) => a.built)
