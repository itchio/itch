
unzip = require "unzip"
fstream = require "fstream"
fs = require "fs"
path = require "path"
Promise = require "bluebird"

# All non-win32 platforms need correct file permissions
restorePermissions = (process.platform != "win32")

extract = (archive_path, dest_path) ->
  console.log "Extracting ZIP archive '#{archive_path}' to '#{dest_path}'"

  parser = unzip.Parse()

  if restorePermissions
    # FIXME get 'mode' support merged into node-unzip-2, remove fork.
    parser.on 'metadata', (entry) ->
      entry_path = path.join dest_path, entry.path
      # always keep read-write on every file so we can update them.
      mode = entry.mode | 0o600
      fs.chmodSync entry_path, mode

  src = fstream.Reader(archive_path).pipe(parser)
  dst = fstream.Writer {
    path: dest_path
    type: "Directory"
  }
  pipeline = src.pipe(dst)

  new Promise (resolve, reject) ->
    pipeline.on 'error', (e) ->
      throw e
      reject e
    pipeline.on 'close', ->
      resolve()

module.exports = { extract }

