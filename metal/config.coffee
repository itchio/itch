nconf = require "nconf"

nconf.file file: "./config.json"

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

