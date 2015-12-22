'use strict'

// TODO: that's not a good place to store preferences.
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
  let val = nconf.get(setting_key)
  console.log(`preferences.read(${setting_key}) = ${val}`)
  return val
}

module.exports = {
  save, read
}
