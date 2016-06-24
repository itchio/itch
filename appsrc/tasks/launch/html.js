
import btoa from 'btoa'
import path from 'path'
import invariant from 'invariant'
import Promise from 'bluebird'

import electron from '../../electron'
const {app, BrowserWindow, shell, powerSaveBlocker} = electron

import url from '../../util/url'
import fetch from '../../util/fetch'
import pathmaker from '../../util/pathmaker'
import httpServer from '../../util/http-server'
import debugBrowserWindow from '../../util/debug-browser-window'

import mklog from '../../util/log'
const log = mklog('tasks/launch')

export default async function launch (out, opts) {
  const {cave, market, credentials, env} = opts
  invariant(cave, 'launch-html has cave')
  invariant(market, 'launch-html has market')
  invariant(credentials, 'launch-html has credentials')
  invariant(env, 'launch-html has env')

  const game = await fetch.gameLazily(market, credentials, cave.gameId, {game: cave.game})
  const injectPath = path.resolve(__dirname, '..', '..', 'inject', 'game.js')

  const appPath = pathmaker.appPath(cave)
  const entryPoint = path.join(appPath, cave.gamePath)

  log(opts, `entry point: ${entryPoint}`)

  const {width, height} = cave.windowSize
  log(opts, `starting at resolution ${width}x${height}`)

  let win = new BrowserWindow({
    title: game.title,
    icon: `./static/images/tray/${app.getName()}.png`,
    width, height,
    center: true,
    show: true,
    backgroundColor: '#fff',
    titleBarStyle: 'hidden',
    useContentSize: true,
    webPreferences: {
      /* don't let web code control the OS */
      nodeIntegration: false,
      /* hook up a few keyboard shortcuts of our own */
      preload: injectPath,
      /* stores cookies etc. in persistent session to save progress */
      partition: `persist:gamesession_${cave.game_id}`
    }
  })

  const itchObject = {
    env
  }

  // open dev tools immediately if requested
  if (process.env.IMMEDIATE_NOSE_DIVE === '1') {
    debugBrowserWindow(`game ${game.title}`, win)
    win.webContents.openDevTools({detach: true})
  }

  // hide menu, cf. https://github.com/itchio/itch/issues/232
  win.setMenuBarVisibility(false)

  // strip 'Electron' from user agent so some web games stop being confused
  let userAgent = win.webContents.getUserAgent()
  userAgent = userAgent.replace(/Electron\/[0-9.]+\s/, '')
  win.webContents.setUserAgent(userAgent)

  // requests to 'itch-internal' are used to communicate between web content & the app
  let internalFilter = {
    urls: ['https://itch-internal/*']
  }
  win.webContents.session.webRequest.onBeforeSendHeaders(internalFilter, (details, callback) => {
    callback({cancel: true})

    let parsed = url.parse(details.url)
    switch (parsed.pathname.replace(/^\//, '')) {
      case 'exit-fullscreen':
        win.setFullScreen(false)
        break
      case 'toggle-fullscreen':
        win.setFullScreen(!win.isFullScreen())
        break
      case 'open-devtools':
        win.webContents.openDevTools({detach: true})
        break
    }
  })

  win.webContents.on('new-window', (e, url) => {
    e.preventDefault()
    shell.openExternal(url)
  })

  // serve files
  let fileRoot = path.dirname(entryPoint)
  let indexName = path.basename(entryPoint)

  let server = httpServer.create(fileRoot, {'index': [indexName]})

  let port
  server.on('listening', function () {
    port = server.address().port
    log(opts, `serving game on port ${port}`)

    // don't use the HTTP cache, we already have everything on disk!
    const options = {extraHeaders: 'pragma: no-cache\n'}

    win.loadURL(`http://localhost:${port}#${btoa(JSON.stringify(itchObject))}`, options)
  })

  const blockerId = powerSaveBlocker.start('prevent-display-sleep')

  await new Promise((resolve, reject) => {
    win.on('close', () => {
      win.webContents.session.clearCache(resolve)
    })
  })

  powerSaveBlocker.stop(blockerId)

  log(opts, `shutting down http server on port ${port}`)
  server.close()
}
