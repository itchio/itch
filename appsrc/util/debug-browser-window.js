
/**
 * Gives us some log of what happens in the browser window, helps debugging the flow
 */
function enable_event_debugging (prefix, win) {
  let events = 'page-title-updated close closed unresponsive responsive blur focus maximize unmaximize minimize restore resize move moved enter-full-screen enter-html-full-screen leave-html-full-screen app-command'
  events.split(' ').forEach((ev) => {
    win.on(ev, (e, deets) => {
      console.log(`${prefix} window event: ${ev}, ${JSON.stringify(deets, null, 2)}`)
    })
  })

  let cevents = 'did-finish-load did-fail-load did-frame-finish-load did-start-loading did-stop-loading did-get-response-details did-get-redirect-request dom-ready page-favicon-updated new-window will-navigate crashed plugin-crashed destroyed'
  cevents.split(' ').forEach((ev) => {
    win.webContents.on(ev, (e, deets) => {
      console.log(`${prefix} webcontents event: ${ev}, ${JSON.stringify(deets, null, 2)}`)
    })
  })
}

module.exports = enable_event_debugging
