
AppActions = require "./actions/AppActions"
tray = require "./tray"

BrowserWindow = require "browser-window"

booted = false
main_window = null

get = ->
  main_window

hide = ->
  main_window?.close()

show = ->
  if main_window
    main_window.show()
    return

  unless booted
    AppActions.boot()
    booted = true

  main_window = new BrowserWindow {
    title: "itch.io"
    icon: "./static/images/itchio-tray-x4.png"
    width: 1200
    height: 720
    center: true
    "title-bar-style": "hidden"
  }

  main_window.on "close", (e) ->
    main_window = null

  main_window.loadUrl "file://#{__dirname}/../index.html"

  if process.env.DEVTOOLS
    main_window.openDevTools()

install = ->
  app = require "app"

  app.on "window-all-closed", (e) ->
    console.log "window-all-closed"
    e.preventDefault()

  app.on "ready", ->
    console.log "ready"
    tray.make_tray()
    show()

  app.on "activate", ->
    console.log "activate"
    show()

  app.on "ready", ->
    show()

module.exports = {
  install
  show
  hide
  get
}

