app = require "app"
ipc = require "ipc"

config = require "./metal/config"
{ refresh_menu } = require "./metal/menu"

AppStore = require "./metal/stores/AppStore"
AppStore.add_change_listener 'menu', ->
  setTimeout (-> refresh_menu()), 0

AppActions = require "./metal/actions/AppActions"

BrowserWindow = require "browser-window"

mainWindow = null
booted = false

makeMainWindow = ->
  if mainWindow
    mainWindow.show()
    return

  mainWindow = new BrowserWindow width: 1200, height: 720
  mainWindow.webContents.on "dom-ready", ->
    unless booted
      AppActions.boot()
      booted = true
  mainWindow.loadUrl "file://#{__dirname}/index.html"

  mainWindow.openDevTools()

  mainWindow.on "closed", ->
    mainWindow = null

  app.mainWindow = mainWindow

app.on "window-all-closed", ->
  unless process.platform == "darwin"
    app.quit()

app.on "activate", ->
  makeMainWindow()
 
app.on "ready", ->
  makeMainWindow()

