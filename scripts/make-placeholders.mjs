#!/usr/bin/env node
/**
 * Generate stand-in images for photographs that have not been taken yet.
 *
 * A lesson that references a photo should still lay out correctly, and the
 * parent should be able to replace the picture by dropping a real file over the
 * placeholder rather than by editing the lesson. So the placeholders live at the
 * exact paths the lessons ask for, with the exact extensions.
 *
 * Every one of them says, on its face, what photograph belongs there.
 * check-content.mjs lists any that are still in place.
 *
 *   node scripts/make-placeholders.mjs
 */
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { chromium } from 'playwright'
import { ROOT } from './lib/curriculum.mjs'

/**
 * Placeholders are recorded by content hash in public/media/placeholders.json.
 * check-content.mjs uses it to list which photographs are still stand-ins — and
 * because the record is a hash, dropping a real photograph over one clears it
 * automatically, with nothing to remember to update.
 */
const MANIFEST = path.join(ROOT, 'public/media/placeholders.json')
const sha = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 16)

const WANTED = [
  {
    file: 'media/l01/eniac.jpg',
    title: 'ENIAC, or another room-sized early computer',
    note: 'Public domain. A computer with no screen and no keyboard, that you walk inside.',
  },
  {
    file: 'media/l01/vending.jpg',
    title: 'A vending machine',
    note: 'Take this one yourself. The coin slot and the buttons need to be visible.',
  },
  {
    file: 'media/l01/traffic-light.jpg',
    title: 'A traffic light with a pedestrian button',
    note: 'Take this one yourself. Get the button in frame — its lit ring is the whole point.',
  },
]

const html = ({ title, note, file }) => `<!doctype html>
<meta charset="utf-8">
<style>
  html, body { margin: 0; width: 1280px; height: 720px; }
  body {
    background: #5b6670;
    color: #edf0f3;
    font-family: ui-monospace, "DejaVu Sans Mono", monospace;
    display: grid;
    place-content: center;
    text-align: center;
    gap: 18px;
    padding: 80px;
    box-sizing: border-box;
    position: relative;
  }
  body::before {
    content: '';
    position: absolute;
    inset: 40px;
    border: 2px solid #7a868f;
  }
  .kicker { font-size: 20px; letter-spacing: .22em; color: #d3dae1; }
  h1 { font-size: 44px; font-weight: 600; margin: 0; line-height: 1.2; letter-spacing: -.01em; }
  p { font-size: 20px; line-height: 1.5; color: #d3dae1; margin: 0; max-width: 46ch; justify-self: center; }
  code { font-size: 17px; color: #edf0f3; }
</style>
<p class="kicker">PHOTOGRAPH GOES HERE</p>
<h1>${title}</h1>
<p>${note}</p>
<code>public/${file}</code>
<p style="font-size:16px">Replace this file. See DECISIONS.md #5.</p>
`

const force = process.argv.includes('--force')
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {}
let made = 0

for (const spec of WANTED) {
  const out = path.join(ROOT, 'public', spec.file)
  if (existsSync(out) && !force) {
    // Already a real photograph, or a placeholder from an earlier run. Either
    // way, do not overwrite it — that would be this script eating the parent's
    // photo, which is the one thing it must never do.
    manifest[spec.file] ??= sha(readFileSync(out))
    console.log(`kept    ${spec.file}`)
    continue
  }
  mkdirSync(path.dirname(out), { recursive: true })
  await page.setContent(html(spec), { waitUntil: 'load' })
  const buf = await page.screenshot({ type: 'jpeg', quality: 82 })
  writeFileSync(out, buf)
  manifest[spec.file] = sha(buf)
  console.log(`wrote   ${spec.file}`)
  made += 1
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
await browser.close()
console.log(`\n${made} placeholder(s) written. Replace them with real photographs.`)
