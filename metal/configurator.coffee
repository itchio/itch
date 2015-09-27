
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
          plist_path = path.join(app_bundle, "Contents", "Info.plist")
          console.log "Attempting to read plist at #{plist_path}"
          continue unless fs.existsSync(plist_path)
          xml = fs.readFileSync(plist_path, encoding: 'utf8')
          xml2js = require "xml2js"
          xml2js.parseString xml, (err, res) ->
            dict = res.plist.dict[0]
            dict = _.object dict.key, dict.string
            console.log "got dict: \n#{JSON.stringify dict}"
            exec_name = dict.CFBundleExecutable
            exec_path = path.join(app_bundle, "Contents", "MacOS", exec_name)
            console.log "making #{exec_path} executable"
            fs.chmodSync(exec_path, 0o777)

            glob "#{app_bundle}/**/*", (err, files) ->
              console.log "Checking #{files.length} files to see if we have more executables"
              for file in files
                stats = fs.lstatSync file
                continue unless stats?.isFile()

                buf = read_chunk.sync(file, 0, 262)

                format = switch
                  # intel Mach-O executables start with 0xCEFAEDFE
                  # (old PowerPC Mach-O executables started with 0xFEEDFACE)
                  when buf[0] == 0xCE && buf[1] == 0xFA && buf[2] == 0xED && buf[3] == 0xFE
                    'mach-o executable'

                  # Shell-script start with an interro-bang
                  when buf[0] == 0x23 && buf[1] == 0x21
                    'shell script'

                if format
                  console.log "#{path.relative(app_bundle, file)} looks like a #{format}, +x'ing it"
                  fs.chmodSync(file, 0o777)

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

