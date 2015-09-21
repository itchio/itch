app = require "app"
path = require "path"
fs = require "fs"
request = require "request"
progress = require "request-progress"
shell = require "shell"

fileutils = require "./fileutils"

module.exports = {
  queue: (item) ->
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
    r = progress request.get(item.url), throttle: 25
    r.on 'response', (response) ->
      console.log "Got status code: #{response.statusCode}"
      contentLength = response.headers['content-length']
      console.log "Got content length: #{contentLength}"

    r.on 'progress', (state) ->
      app.mainWindow.setProgressBar(state.percent / 100) # only works on Windows & Linux Unity
      percent = "#{state.percent.toFixed()}%"
      app.dock.setBadge(percent)

    r.pipe(fs.createWriteStream destPath).on 'finish', ->
      console.log "Trying to open #{destPath}"
      app.mainWindow.setProgressBar(-1) # disable
      app.dock.setBadge("")
      shell.openItem(destPath)
}

