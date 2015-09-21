app = require "app"
path = require "path"
fs = require "fs"
request = require "request"
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
    request.get(item.url).on('response', (response) ->
      console.log "Got status code: #{response.statusCode}"
      console.log "Got content length: #{response.headers['content-length']}"
    ).pipe(fs.createWriteStream destPath).on 'finish', ->
      console.log "Trying to open #{destPath}"
      shell.openItem(destPath)
}

