
path = require "path"
glob = require "glob"
fileutils = require "./fileutils"
Promise = require "bluebird"

# skip some typical junk we find in archives that's supposed
# to be hidden / in trash / isn't in anyway relevant to what
# we're trying to do
skip_bs = (files, app_path) ->
  files.filter((file) ->
    !/^__MACOSX/.test(path.relative(app_path, file))
  )

configure = (app_path) ->
  console.log "Configuring app at '#{app_path}'"

  new Promise (resolve, reject) ->
    glob fileutils.exe_glob(app_path), (err, files) ->
      files = skip_bs(files, app_path)
      if files.length > 0
        console.log "Potential executables: #{JSON.stringify files}"

      resolve { executables: files }

module.exports = { configure }

