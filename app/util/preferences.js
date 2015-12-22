'use strict'

let nconf = require('nconf').file({file: get_user_home() + '/itch-preferences.json'}) // OS "home" folder.

function get_user_home () {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME']
}

function save (setting_key, setting_value) {
  nconf.set(setting_key, setting_value)
  nconf.save()
}

function read (setting_key) {
  nconf.load()
  return nconf.get(setting_key)
}

module.exports = {
  save: save,
  read: read
}
