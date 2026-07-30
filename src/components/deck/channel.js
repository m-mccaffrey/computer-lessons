/**
 * Sync between the deck window and the presenter window.
 *
 * BroadcastChannel where it exists; a localStorage `storage` event otherwise,
 * which fires in *other* tabs of the same origin and so does the same job.
 * Both are same-origin only and neither touches the network — nothing about a
 * lesson leaves the machine.
 */

const NAME = 'deck'
const LS_KEY = 'cc:deck:sync'

export function openChannel(onMessage) {
  let bc = null

  if ('BroadcastChannel' in window) {
    bc = new BroadcastChannel(NAME)
    bc.onmessage = (e) => onMessage(e.data)
  }

  const onStorage = (e) => {
    if (e.key !== LS_KEY || !e.newValue) return
    try {
      onMessage(JSON.parse(e.newValue).payload)
    } catch {
      /* a half-written value is not worth interrupting a lesson over */
    }
  }
  window.addEventListener('storage', onStorage)

  return {
    post(payload) {
      if (bc) bc.postMessage(payload)
      // Always mirror to localStorage: BroadcastChannel may exist while the
      // other window predates it, and a duplicate message is harmless because
      // applying the same state twice is a no-op.
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ t: Date.now(), payload }))
      } catch {
        /* private mode, quota, or a locked-down Pi. Not fatal. */
      }
    },
    close() {
      if (bc) bc.close()
      window.removeEventListener('storage', onStorage)
    },
  }
}
