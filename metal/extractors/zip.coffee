
path = require "path"
Zip = require "node-7z"

switch process.platform
  when "darwin"
    # ship 7za with the client
    process.env.PATH += ':.'

normalize = (p) ->
  path.normalize p.replace /[\s]*$/, ""

extract = (archive_path, dest_path) ->
  console.log "Extracting ZIP archive '#{archive_path}' to '#{dest_path}'"

  li = new Zip().list(archive_path)

  sizes = {}
  totalSize = 0

  li.progress((files) =>
    console.log "Got info about #{files.length} files"
    for f in files
      totalSize += f.size
      npath = normalize f.name
      sizes[npath] = f.size
      console.log "#{npath} (#{f.size} bytes)"
  )

  extractedSize = 0

  li.then (spec) =>
    console.log "total extracted size: #{totalSize}"
    # console.log "spec = \n#{JSON.stringify spec}"

    xr = new Zip().extractFull(archive_path, dest_path)
    xr.progress((files) =>
      console.log "Got progress about #{files.length} files"
      for f in files
        npath = normalize f
        if size = sizes[npath]
          extractedSize += size
          console.log "#{npath} (#{size} bytes)"
        else
          console.log "#{npath} (size not found)"
      console.log "Estimated progress: #{extractedSize} of #{totalSize} bytes, ~#{Math.round(extractedSize / totalSize * 100)}%"
    )
    xr

module.exports = { extract }

