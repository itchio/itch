app = require "app"
ipc = require "ipc"

config = require "./metal/config"
{ refresh_menu } = require "./metal/menu"

AppStore = require "./metal/stores/AppStore"
AppStore.add_change_listener 'menu', ->
  setTimeout (-> refresh_menu()), 0

AppActions = require "./metal/actions/AppActions"

BrowserWindow = require "browser-window"

main_window = null

booted = false
quitting = false

make_tray = ->
  Menu = require "menu"

  tray_menu_template = [
    {
      label: "Owned"
      click: -> AppActions.focus_panel "owned"
    }
    {
      label: "Dashboard"
      click: -> AppActions.focus_panel "dashboard"
    }
  ]
  if process.platform != "darwin"
    tray_menu_template.concat [
      {
        type: "separator"
      }
      {
        label: "Exit"
        click: -> AppActions.quit()
      }
    ]

  tray_menu = Menu.buildFromTemplate tray_menu_template

  if process.platform == "darwin"
    app.dock.setMenu tray_menu
  else
    Tray = require "tray"
    tray = new Tray("./static/images/itchio-tray-small.png")
    tray.setToolTip "itch.io"
    tray.setContextMenu tray_menu
    tray.on "clicked", -> AppActions.focus_window()
    tray.on "double-clicked", -> AppActions.focus_window()
    app.main_tray = tray

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
    unless quitting
      e.preventDefault()
      main_window.hide()

  main_window.loadUrl "file://#{__dirname}/index.html"

app.on "before-quit", ->
  quitting = true

app.on "window-all-closed", ->
  unless process.platform == "darwin"
    app.quit()

app.on "ready", ->
  make_tray()
  make_main_window()

app.on "activate", ->
  main_window?.show()

