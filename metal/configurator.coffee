
read_chunk = require "read-chunk"
fs = require "fs"
path = require "path"
glob = require "glob"
_ = require "underscore"
fileutils = require "./fileutils"
Promise = require "bluebird"

# skip some typical junk we find in archives that's supposed
# to be hidden / in trash / isn't in anyway relevant to what
# we're trying to do
skip_bs = (files, app_path) ->
  files.filter((file) ->
    !/^__MACOSX/.test(path.relative(app_path, file))
  )

# TODO: refactor + better error handling
fix_permissions = (files, app_path) ->
  new Promise (resolve, reject) ->
    switch process.platform
      when "darwin"
        for app_bundle in files
          stats = fs.lstatSync app_bundle
          console.log "Attempting to fix permissions for #{app_bundle}"
          continue unless stats.isDirectory()

          candidates = glob.sync "#{app_bundle}/**/*", nodir: true
          console.log "Probing #{candidates.length} files for executables"
          for candidate in candidates
            buf = read_chunk.sync(candidate, 0, 8)

            format = switch
              # intel Mach-O executables start with 0xCEFAEDFE
              # (old PowerPC Mach-O executables started with 0xFEEDFACE)
              when buf[0] == 0xCE && buf[1] == 0xFA && buf[2] == 0xED && buf[3] == 0xFE
                'mach-o executable'

              # Shell-script start with an interro-bang
              when buf[0] == 0x23 && buf[1] == 0x21
                'shell script'

            if format
              console.log "#{path.relative(app_bundle, candidate)} looks like a #{format}, +x'ing it"
              fs.chmodSync(candidate, 0o777)

          resolve []
      else
        resolve []

configure = (app_path) ->
  console.log "Configuring app at '#{app_path}'"

  new Promise (resolve, reject) ->
    glob fileutils.exe_glob(app_path), (err, files) ->
      files = skip_bs(files, app_path)
      if files.length > 0
        console.log "Potential executables: #{JSON.stringify files}"

      fix_permissions(files, app_path).then =>
        resolve { executables: files }

module.exports = { configure }

