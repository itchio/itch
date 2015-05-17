app = require "app"
ipc = require "ipc"
nconf = require "nconf"

nconf.file file: "./config.json"

BrowserWindow = require "browser-window"

main_window = null

ipc.on "get_config", (event, id, key) ->
  event.sender.send "return_get_config", id, nconf.get key

ipc.on "set_config", (event, key, value) ->
  console.log "Setting config: #{key}, #{value}"
  nconf.set key, value
  nconf.save (err) ->
    console.log "Could not save config: #{err}"

app.on "window-all-closed", ->
  unless process.platform == "darwin"
    app.quit()

app.on "ready", ->
  main_window = new BrowserWindow width: 1200, height: 600
  main_window.loadUrl "file://#{__dirname}/index.html"

  main_window.openDevTools()

  main_window.on "closed", ->
    main_window = null
