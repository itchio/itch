
import nconf from 'nconf'
import path from 'path'
import {app} from '../electron'

let configFile = path.join(app.getPath('userData'), 'config.json')
try {
  nconf.file({file: configFile})
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

export default self
