
read_chunk = require "read-chunk"
file_type = require "file-type"

Promise = require "bluebird"

extract = (archive_path, dest_path) ->
  buffer = read_chunk.sync(archive_path, 0, 262)
  type = file_type(buffer)

  console.log "type for #{archive_path}: #{JSON.stringify type}"

  switch type.ext
    when 'zip', 'gz', 'bz2', '7z'
      require("./extractors/7zip").extract archive_path, dest_path
    else
      p = Promise.reject "Don't know how to extract #{archive_path} / #{JSON.stringify type}"
      p.progress = (-> p)
      p

module.exports = { extract }

