
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

fix_permissions = (files) ->
  new Promise (resolve, reject) ->
    switch process.platform
      when "darwin"
        for file in files
          stats = fs.lstatSync file
          console.log "Attempting to fix permissions for #{file}"
          continue unless stats.isDirectory()
          plist_path = path.join(file, "Contents", "Info.plist")
          console.log "Attempting to read plist at #{plist_path}"
          continue unless fs.existsSync(plist_path)
          xml = fs.readFileSync(plist_path, encoding: 'utf8')
          require("xml2js").parseString xml, (err, res) ->
            dict = res.plist.dict[0]
            dict = _.object dict.key, dict.string
            console.log "got dict: \n#{JSON.stringify dict}"
            exec_name = dict.CFBundleExecutable
            exec_path = path.join(file, "Contents", "MacOS", exec_name)
            console.log "making #{exec_path} executable"
            fs.chmodSync(exec_path, 0o777)
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

      fix_permissions(files).then =>
        resolve { executables: files }

module.exports = { configure }

