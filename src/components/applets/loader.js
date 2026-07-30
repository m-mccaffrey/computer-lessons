/**
 * Loads only the applets a page actually contains.
 *
 * import.meta.glob makes Vite emit one chunk per applet; this then fetches the
 * chunk only if its tag is present in the DOM. A lesson with no applets pays
 * about 400 bytes for this file and nothing else, which is what keeps a lesson
 * page inside the Pi 400's budget (spec §1).
 */
const modules = import.meta.glob('./*.js')

for (const path in modules) {
  const tag = path.slice(2, -3) // './binary-counter.js' -> 'binary-counter'
  if (tag === 'loader') continue
  if (document.querySelector(tag)) {
    modules[path]().catch((err) => {
      // A broken applet must never take the slide down with it: the <noscript>
      // fallback and the headline are still there, and the lesson goes on.
      console.error(`[applet] ${tag} failed to load`, err)
    })
  }
}
