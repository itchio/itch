app = require "app"
ipc = require "ipc"
nconf = require "nconf"
path = require "path"
fs = require "fs"
request = require "request"
shell = require "shell"

fileutils = require "./node/fileutils"

nconf.file file: "./config.json"

BrowserWindow = require "browser-window"

mainWindow = null

ipc.on "getConfig", (event, id, key) ->
  event.sender.send "returnGetConfig", id, nconf.get key

ipc.on "setConfig", (event, key, value) ->
  console.log "Setting config: #{key}, #{value}"
  nconf.set key, value
  nconf.save (err) ->
    if err
      console.log "Could not save config: #{err}"

app.on "window-all-closed", ->
  unless process.platform == "darwin"
    app.quit()

app.on "ready", ->
  mainWindow = new BrowserWindow width: 1200, height: 900
  mainWindow.loadUrl "file://#{__dirname}/index.html"

  mainWindow.openDevTools()

  mainWindow.on "closed", ->
    mainWindow = null

app.on "download", (item) ->
  itchioPath = path.join(app.getPath("home"), "Downloads", "itch.io")
  tempPath = path.join(itchioPath, "archives")
  appPath = path.join(itchioPath, "apps")

  for _, folder of [tempPath, appPath]
    console.log "Making directory #{folder}"
    try
      fs.mkdirSync(folder)
    catch e
      throw e unless e.code == 'EEXIST'

  ext = fileutils.ext item.upload.filename
  destPath = path.join(tempPath, "upload-#{item.upload.id}#{ext}")

  console.log "Downloading #{item.game.title} to #{destPath}"
  request.get(item.url).on('response', (response) ->
    console.log "Got status code: #{response.statusCode}"
    console.log "Got content length: #{response.headers['content-length']}"
  ).pipe(fs.createWriteStream destPath).on 'finish', ->
    console.log "Trying to open #{destPath}"
    shell.openItem(destPath)


