let path = require('path')
let http = require('http')
let Promise = require('bluebird')
let BrowserWindow = require('electron').BrowserWindow
let serveStatic = require('serve-static')
let finalhandler = require('finalhandler')

let db = require('../../util/db')

let log = require('../../util/log')('tasks/launch')

let CaveStore = require('../../stores/cave-store')

let self = {
  launch: async function(opts, cave) {
    let game = await db.find_one({_table: 'games', id: cave.game_id})
    let app_path = path.join(CaveStore.app_path(cave.install_location, opts.id), cave.game_root)
    log(opts, `game root: ${app_path}`)
    let win = new BrowserWindow({
      title: game.title,
      icon: './static/images/itchio-tray-x4.png',
      width: cave.window_size.width, height: cave.window_size.height,
      center: true,
      show: true,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        partition: `persist:gamesession_${cave.game_id}`
      }
    })
    let serve = serveStatic(app_path, {'index': ['index.html', 'index.htm']})
    let server = http.createServer((req, res) => {
      let done = finalhandler(req, res)
      serve(req, res, done)
    })
    let port
    server.listen(0) // let node/os assign random port
    server.on('listening', function () {
      port = server.address().port
      log(opts, `serving game on port ${port}`)
      win.loadURL(`http://localhost:${port}/index.html`)
      if (process.env.DEVTOOLS === '1') {
        win.webContents.openDevTools({detach: true})
      }
    })

    await new Promise((resolve, reject) => {
      win.on('close', (e) => {
        resolve()
      })
    })

    log(opts, `shutting down http server on port ${port}`)
    server.close()
  }
}

module.exports = self
