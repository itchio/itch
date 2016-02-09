let path = require('path')
let Promise = require('bluebird')
let BrowserWindow = require('electron').BrowserWindow
let serveStatic = require('serve-static')
let finalhandler = require('finalhandler')
let http = require('http')

let db = require('../../util/db')
let url = require('../../util/url')
let debug_browser_window = require('../../util/debug-browser-window')

let log = require('../../util/log')('tasks/launch')

let CaveStore = require('../../stores/cave-store')

let self = {
  launch: async function(opts, cave) {
    let game = await db.find_one({_table: 'games', id: cave.game_id})
    let inject_path = path.resolve(__dirname, '..', '..', 'inject', 'game.js')
    let entry_point = path.join(CaveStore.app_path(cave.install_location, opts.id), cave.game_path)

    log(opts, `entry point: ${entry_point}`)
    let win = new BrowserWindow({
      title: game.title,
      icon: './static/images/itchio-tray-x4.png',
      width: cave.window_size.width,
      height: cave.window_size.height,
      center: true,
      show: true,
      backgroundColor: '#000',
      'title-bar-style': 'hidden',
      useContentSize: true,
      webPreferences: {
        /* don't let web code control the OS */
        nodeIntegration: false,
        /* hook up a few keyboard shortcuts of our own */
        preload: inject_path,
        /* stores cookies etc. in persistent session to save progress */
        partition: `persist:gamesession_${cave.game_id}`
      }
    })

    win.webContents.on('dom-ready', (e) => {
      win.webContents.insertCSS('body { background: #000; }')
    })

    // open dev tools immediately if requested
    if (process.env.IMMEDIATE_NOSE_DIVE === '1') {
      debug_browser_window(`game ${game.title}`, win)
      win.webContents.openDevTools({detach: true})
    }

    // clear menu, cf. https://github.com/itchio/itch/issues/232
    win.setMenu(null)

    // strip 'Electron' from user agent so some web games stop being confused
    let userAgent = win.webContents.getUserAgent()
    userAgent = userAgent.replace(/Electron\/[0-9.]+\s/, '')
    win.webContents.setUserAgent(userAgent)

    // requests to 'itch-internal' are used to
    let internal_filter = {
      urls: ['https://itch-internal/*']
    }
    win.webContents.session.webRequest.onBeforeSendHeaders(internal_filter, (details, callback) => {
      callback({cancel: true})

      let parsed = url.parse(details.url)
      switch (parsed.pathname.replace(/^\//, '')) {
        case 'toggle-fullscreen':
          win.setFullScreen(!win.isFullScreen())
          break
        case 'open-devtools':
          win.webContents.openDevTools({detach: true})
          break
      }
    })

    // serve files
    let file_root = path.dirname(entry_point)
    let index_name = path.basename(entry_point)

    let serve = serveStatic(file_root, {'index': [index_name]})
    let server = http.createServer((req, res) => {
      let done = finalhandler(req, res)
      serve(req, res, done)
    })
    let port
    server.listen(0) // let node/os assign random port

    server.on('listening', function () {
      port = server.address().port
      log(opts, `serving game on port ${port}`)

      // don't use the HTTP cache, we already have everything on disk!
      const options = {extraHeaders: 'pragma: no-cache\n'}
      win.loadURL(`http://localhost:${port}`, options)
    })

    await new Promise((resolve, reject) => {
      win.on('close', resolve)
    })

    log(opts, `shutting down http server on port ${port}`)
    server.close()

    win.webContents.session.clearCache()
  }
}

module.exports = self
