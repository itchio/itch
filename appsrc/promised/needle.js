
import Promise from 'bluebird'
import needle from 'needle'

import {app} from '../electron'
import os from '../util/os'

needle.defaults({
  user_agent: `itch/${app.getVersion()} (${os.platform()}; Electron/${os.getVersion('electron')} Chrome/${os.getVersion('chrome')})`
})

const err = new Error('Offline mode active!')
err.code = 'ENOTFOUND'

function isOffline () {
  const store = require('../store').default
  if (store) {
    return store.getState().preferences.offlineMode
  } else {
    return false
  }
}

import {EventEmitter} from 'events'

function close () {
  for (let i = arguments.length - 1; i >= 0; i--) {
    const callback = arguments[i]
    if (!callback) continue
    if (typeof callback === 'function') {
      callback(err)
    }
    break
  }

  const out = new EventEmitter()
  setImmediate(() => out.emit('end', err))
  return out
}

'head get'.split(' ').forEach(function (method) {
  module.exports[method] = function (uri, options, callback) {
    if (isOffline()) {
      return close(uri, options, callback)
    }
    return needle[method](uri, options, callback)
  }
})

'post put patch delete'.split(' ').forEach(function (method) {
  module.exports[method] = function (uri, data, options, callback) {
    if (isOffline()) {
      return close(uri, data, options, callback)
    }
    return needle[method](uri, data, options, callback)
  }
})

module.exports.request = function (method, uri, data, opts, callback) {
  if (isOffline()) {
    return close(method, uri, data, opts, callback)
  }
  return needle.request(method, uri, data, opts, callback)
}

Promise.promisifyAll(module.exports)
