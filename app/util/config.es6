
import nconf from 'nconf'
import path from 'path'
import app from 'app'

let config_file = path.join(app.getPath('userData'), 'config.json')
try {
  nconf.file({file: config_file})
} catch (e) {
  // We don't want that to be fatal
  console.log(`Could not read config: ${e}`)
}

function save () {
  nconf.save((err) => {
    if (err) {
      console.log(`Could not save config: ${err}`)
    }
  })
}

function get (key) {
  return nconf.get(key)
}

function set (key, value) {
  nconf.set(key, value)
  save()
}

function clear (key) {
  nconf.clear(key)
  save()
}

export default { save, get, set, clear }
