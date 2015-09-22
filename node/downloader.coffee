app = require "app"
path = require "path"
fs = require "fs"
request = require "request"
progress = require "request-progress"
shell = require "shell"
unzip = require "unzip2"

fileutils = require "./fileutils"

setProgress = (alpha) ->
  if alpha < 0
    app.mainWindow.setProgressBar(-1)
    app.dock?.setBadge ""
  else
    percent = alpha * 100
    app.mainWindow.setProgressBar(alpha)
    app.dock?.setBadge "#{state.percent.toFixed()}%"

queue = (item) ->
  itchioPath = path.join(app.getPath("home"), "Downloads", "itch.io")
  tempPath = path.join(itchioPath, "archives")
  appPath = path.join(itchioPath, "apps", item.game.title)

  for _, folder of [tempPath, appPath]
    console.log "Making directory #{folder}"
    try
      fs.mkdirSync(folder)
    catch e
      throw e unless e.code == 'EEXIST'

  ext = fileutils.ext item.upload.filename
  destPath = path.join(tempPath, "upload-#{item.upload.id}#{ext}")

  afterDownload = ->
    # fs.createReadStream(destPath).pipe(unzip.Extract(path: appPath)).on 'finish', ->
    #   app.mainWindow.webContents.executeJavaScript("new Notification('#{item.game.title} finished downloading.')")
    #   shell.openItem(appPath)
    fs.createReadStream(destPath).pipe(unzip.Parse()).on 'entry', (entry) ->
      entry.autodrain()

  if fs.existsSync destPath
    afterDownload()
  else
    app.mainWindow.webContents.executeJavaScript("new Notification('Downloading #{item.game.title}')")
    console.log "Downloading #{item.game.title} to #{destPath}"

    r = progress request.get(item.url), throttle: 25
    r.on 'response', (response) ->
      console.log "Got status code: #{response.statusCode}"
      contentLength = response.headers['content-length']
      console.log "Got content length: #{contentLength}"

    r.on 'progress', (state) ->
      setProgress 0.01 * state.percent

    r.pipe(fs.createWriteStream destPath).on 'finish', ->
      console.log "Trying to open #{destPath}"
      setProgress -1
      afterDownload()

module.exports = {
  queue: queue
  setProgress: setProgress
}

