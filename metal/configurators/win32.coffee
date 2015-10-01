
_ = require "underscore"
Promise = require "bluebird"
glob = Promise.promisify require "glob"

log = (msg) -> console.log "[configurators/win32] #{msg}"

configure = (app_path) ->
  promises = ['exe', 'bat'].map (ext) -> glob("#{app_path}/**/*.#{ext}")

  Promise.all(promises).then(_.flatten).then((executables) ->
    log "Found #{executables.length} executables"
    { executables }
  )

module.exports = {
  configure
}

