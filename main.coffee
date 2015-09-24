app = require "app"
ipc = require "ipc"

config = require "./metal/config"
{ refresh_menu } = require "./metal/menu"

AppStore = require "./metal/stores/AppStore"
AppStore.add_change_listener ->
  setTimeout (-> refresh_menu()), 0

BrowserWindow = require "browser-window"

mainWindow = null

app.on "window-all-closed", ->
  unless process.platform == "darwin"
    app.quit()

app.on "ready", ->
  mainWindow = new BrowserWindow width: 1200, height: 720
  mainWindow.loadUrl "file://#{__dirname}/index.html"

  mainWindow.openDevTools()

  mainWindow.on "closed", ->
    mainWindow = null

  app.mainWindow = mainWindow

