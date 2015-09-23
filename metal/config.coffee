nconf = require "nconf"

nconf.file file: "./config.json"

module.exports = {
  get: (key) ->
    nconf.get key

  set: (key, value) ->
    nconf.set key, value
    nconf.save (err) ->
      if err
        console.log "Could not save config: #{err}"
}

