app = require "app"
BrowserWindow = require "browser-window"

main_window = null

app.on "window-all-closed", ->
  unless process.platform == "darwin"
    app.quit()

app.on "ready", ->
  main_window = new BrowserWindow width: 800, height: 600
  main_window.loadUrl "file://#{__dirname}/index.html"

  main_window.openDevTools()

  main_window.on "closed", ->
    main_window = null
