
app = require "app"

BrowserWindow = require "browser-window"

config = require "./metal/config"
tray = require "./metal/tray"

AppStore = require "./metal/stores/AppStore"
AppActions = require "./metal/actions/AppActions"

require("./metal/menu").install()
require("./metal/notifier").install()
require("./metal/install_manager").install()

main_window = null

booted = false
quitting = false

make_main_window = ->
  if main_window
    main_window.show()
    return

  unless booted
    AppActions.boot()
    booted = true

  main_window = new BrowserWindow {
    title: "itch.io"
    icon: "./static/images/itchio-tray.png"
    width: 1200
    height: 720
    center: true
  }
  app.main_window = main_window

  main_window.on "close", (e) ->
    # hide by default, only quit if explicitly required quit
    unless quitting
      e.preventDefault()
      main_window.hide()

  main_window.loadUrl "file://#{__dirname}/index.html"

app.on "before-quit", ->
  quitting = true
     
app.on "ready", ->
  tray.make_tray()
  make_main_window()

app.on "activate", ->
  main_window?.show()

