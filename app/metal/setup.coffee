
Promise = require "bluebird"
spawn = require "win-spawn"
app = require "app"
fs = Promise.promisifyAll require "fs"
path = require "path"
request = require "request"
progress = require "request-progress"
mkdirp = require "mkdirp"

run = ->
  third_party_path = path.join(app.getPath("userData"), "bin")
  mkdirp.sync(third_party_path)
  console.log "Adding #{third_party_path} to path"
  process.env.PATH += ":#{third_party_path}"
  process.env.PATH += ":."

  handlers = {
    onstatus: null
  }

  p = new Promise (resolve, reject) ->
    download = ->
      console.log "Could not launch 7za, attempting download"

      prefix = "https://misc.amos.me/7za/"
      file = switch process.platform
        when "win32"
          "7za.exe"
        when "darwin"
          "7za"
        else
          reject "7-zip missing: 7za must be in $PATH\n(Try installing p7zip-full)"

      return unless file

      status = "Downloading 7-zip..."
      handlers.onstatus? status
      url = "#{prefix}#{file}"
      console.log "Downloading from #{url}"

      r = progress request.get({
        encoding: null # binary
        url
      }), throttle: 15

      r.on 'progress', (state) ->
        handlers.onstatus? "#{status} (#{state.percent}%)"

      target_path = path.join(third_party_path, file)
      dst = fs.createWriteStream(target_path, { defaultEncoding: "binary" })
      r.pipe(dst).on "close", (e) ->
        console.log "Done downloading 7za!"
        switch process.platform
          when "win32"
            # all good
            resolve()
          else
            resolve fs.chmodAsync(target_path, 0o777)

    handlers.onstatus? "Checking for 7-zip"

    try
      child = spawn("7za").on("error", (e) ->
        console.log "while spawning 7za, got error: #{e}"
        handlers.onstatus? "7-zip not present!"
      )
      child.on("close", (code) ->
        if code == 0
          handlers.onstatus? "All good!"
          resolve()
        else
          download()
      )
    catch e
      console.log "Caught error #{e}, downloading"
      download()

  p.status = (cb) ->
    handlers.onstatus = cb
    p

  p

module.exports = {
  run
}

