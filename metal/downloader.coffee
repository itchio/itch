app = require "app"
path = require "path"
fs = require "fs"
request = require "request"
progress = require "request-progress"
shell = require "shell"
unzip = require "unzip"
fstream = require "fstream"
glob = require "glob"

fileutils = require "./fileutils"

setProgress = (alpha) ->
  if alpha < 0
    app.mainWindow?.setProgressBar(-1)
    app.dock?.setBadge ""
  else
    percent = alpha * 100
    app.mainWindow?.setProgressBar(alpha)
    app.dock?.setBadge "#{percent.toFixed()}%"

queue = (item) ->
  itchioPath = path.join(app.getPath("home"), "Downloads", "itch.io")
  tempPath = path.join(itchioPath, "archives")
  appPath = path.join(itchioPath, "apps", item.game.title)

  ext = fileutils.ext item.upload.filename
  destPath = path.join(tempPath, "upload-#{item.upload.id}#{ext}")

  afterDownload = ->
    parser = unzip.Parse()

    unless process.platform == "win32"
      parser.on 'metadata', (entry) ->
        fullPath = path.join(appPath, entry.path)
        fs.chmodSync(fullPath, entry.mode)

    fstream.Reader(destPath).pipe(parser).pipe(fstream.Writer(path: appPath, type: "Directory")).on 'close', ->
      app.mainWindow?.webContents?.executeJavaScript("new Notification('#{item.game.title} finished downloading.')")
      glob fileutils.exeGlob(appPath), (err, files) ->
        files = files.filter((file) ->
          !/^__MACOSX/.test(path.relative(appPath, file))
        )
        console.log "Found files: #{JSON.stringify(files)}"

        if files.length == 1
          exePath = files[0]
          console.log "Found the exec! #{exePath}"
          shell.openItem(exePath)
        else
          shell.openItem(appPath)

    console.log 'Decompression started'

  if fs.existsSync destPath
    afterDownload()
  else
    app.mainWindow?.webContents?.executeJavaScript("new Notification('Downloading #{item.game.title}')")
    console.log "Downloading #{item.game.title} to #{destPath}"

    r = progress request.get(item.url), throttle: 25
    r.on 'response', (response) ->
      console.log "Got status code: #{response.statusCode}"
      contentLength = response.headers['content-length']
      console.log "Got content length: #{contentLength}"

    r.on 'progress', (state) ->
      setProgress 0.01 * state.percent

    r.pipe(fstream.Writer(path: destPath)).on 'close', ->
      console.log "Trying to open #{destPath}"
      setProgress -1
      afterDownload()

module.exports = {
  queue: queue
  setProgress: setProgress
}

