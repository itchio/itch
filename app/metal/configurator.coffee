
read_chunk = require "read-chunk"
fs = require "fs"
path = require "path"
glob = require "glob"
_ = require "underscore"
Promise = require "bluebird"

configure = (app_path) ->
  console.log "Configuring app at '#{app_path}'"

  switch process.platform
    when "darwin", "win32", "linux"
      require("./configurators/#{process.platform}").configure app_path
    else
      console.log "Unsupported platform: #{process.platform}"

module.exports = { configure }

