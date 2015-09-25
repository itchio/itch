
readChunk = require "read-chunk"
fileType = require "file-type"

Promise = require "bluebird"

extract = (archivePath, destPath) ->
  buffer = readChunk.sync(archivePath, 0, 262)
  type = fileType(buffer)

  console.log "type for #{archivePath}: #{JSON.stringify type}"
  extractor = require("./extractors/#{type?.ext}")

  if extractor
    return extractor.extract archivePath, destPath
  else
    Promise.reject "Don't know how to extract: #{archivePath}"

module.exports = { extract }

