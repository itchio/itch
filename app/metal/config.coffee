nconf = require "nconf"
path = require "path"
app = require "app"

config_file = path.join(app.getPath("userData"), "config.json")
nconf.file file: config_file

save = ->
  nconf.save (err) ->
    if err
      console.log "Could not save config: #{err}"

module.exports = {
  get: (key) ->
    nconf.get key

  set: (key, value) ->
    nconf.set key, value
    save()

  clear: (key) ->
    nconf.clear key
    save()
}

