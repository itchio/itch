app = require "app"
ipc = require "ipc"
nconf = require "nconf"
path = require "path"
fs = require "fs"
request = require "request"
shell = require "shell"

nconf.file file: "./config.json"

BrowserWindow = require "browser-window"

mainWindow = null

ipc.on "get_config", (event, id, key) ->
  event.sender.send "return_get_config", id, nconf.get key

ipc.on "set_config", (event, key, value) ->
  console.log "Setting config: #{key}, #{value}"
  nconf.set key, value
  nconf.save (err) ->
    if err
      console.log "Could not save config: #{err}"

app.on "window-all-closed", ->
  unless process.platform == "darwin"
    app.quit()

app.on "ready", ->
  mainWindow = new BrowserWindow width: 1200, height: 600
  mainWindow.loadUrl "file://#{__dirname}/index.html"

  mainWindow.openDevTools()

  mainWindow.on "closed", ->
    mainWindow = null

app.on "download", (item) ->
  homePath = app.getPath("home")
  itchioPath = path.join("Downloads", "itch.io")
  dirPath = path.join(homePath, itchioPath)
  try
    fs.mkdirSync(dirPath)
  catch e
    throw e unless e.code == 'EEXIST'

  fileName = "file.zip"
  destPath = require("path").join(dirPath, fileName)

  console.log "Downloading #{item.url} to #{destPath}"
  request.get(item.url).on('response', (response) ->
    console.log "Got status code: #{response.statusCode}"
  ).pipe(fs.createWriteStream destPath).on 'finish', ->
    console.log "Trying to open #{destPath}"
    shell.openItem(destPath)
    
