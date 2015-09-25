
readChunk = require "read-chunk"
fileType = require "file-type"

Promise = require "bluebird"

extract = (archivePath, destPath) ->
  buffer = readChunk.sync(archivePath, 0, 262)
  type = fileType(buffer)

  console.log "type for #{archivePath}: #{JSON.stringify type}"

  try
    extractor = require("./extractors/#{type?.ext}")
    extractor.extract archivePath, destPath
  catch
    Promise.reject "Don't know how to extract: #{archivePath}"

module.exports = { extract }

