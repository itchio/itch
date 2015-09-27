
path = require "path"
sevenzip = require "node-7z"

# node-7z needs:
#   - 7za.exe next to package.json on win32
#   - 7za in $PATH on linux & darwin
# For linux we'll just have to let users install p7zip-full
# For OSX, the binary doesn't depend on any funky dynlibs so
# we can just ship it with releases, but we need to amend the path here
switch process.platform
  when "darwin"
    process.env.PATH += ':.'

normalize = (p) ->
  path.normalize p.replace /[\s]*$/, ""

extract = (archive_path, dest_path) ->
  console.log "Extracting archive '#{archive_path}' to '#{dest_path}' with 7-Zip"

  li = new sevenzip().list(archive_path)

  sizes = {}
  total_size = 0
  extracted_size = 0

  handlers = {
    onprogress: null
  }

  li.progress((files) ->
    console.log "Got info about #{files.length} files"
    for f in files
      total_size += f.size
      npath = normalize f.name
      sizes[npath] = f.size
      console.log "#{npath} (#{f.size} bytes)"
  )

  p = new Promise (resolve, reject) ->
    li.then (spec) ->
      console.log "total extracted size: #{total_size}"
      # console.log "spec = \n#{JSON.stringify spec}"

      xr = new sevenzip().extractFull(archive_path, dest_path)
      xr.progress((files) ->
        console.log "Got progress about #{files.length} files"
        for f in files
          npath = normalize f
          if size = sizes[npath]
            extracted_size += size
            console.log "#{npath} (#{size} bytes)"
          else
            console.log "#{npath} (size not found)"
        percent = Math.round(extracted_size / total_size * 100)
        console.log "Estimated progress: #{extracted_size} of #{total_size} bytes, ~#{percent}%"
        handlers.onprogress?({ percent })
      )

      xr.then(->
        resolve { total_size }
      ).catch((e) =>
        reject e
      )

  p.progress = (callback) ->
    handlers.onprogress = callback
    p

  p

module.exports = { extract }

