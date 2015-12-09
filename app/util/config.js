'use nodent';'use strict'

let nconf = require('nconf')
let path = require('path')
let app = require('electron').app

let config_file = path.join(app.getPath('userData'), 'config.json')
try {
  nconf.file({file: config_file})
} catch (e) {
  // We don't want that to be fatal
  console.log(`Could not read config: ${e}`)
}

let self = {
  save: function () {
    nconf.save((err) => {
      if (err) {
        console.log(`Could not save config: ${err}`)
      }
    })
  },

  get: function (key) {
    return nconf.get(key)
  },

  set: function (key, value) {
    nconf.set(key, value)
    self.save()
  },

  clear: function (key) {
    nconf.clear(key)
    self.save()
  }
}

module.exports = self
