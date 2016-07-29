
import Promise from 'bluebird'
import needle from 'needle'
import invariant from 'invariant'

import useragent from '../constants/useragent'

const proxy = process.env.http_proxy || process.env.HTTP_PROXY
const proxySource = proxy ? 'env' : 'direct'

needle.defaults({
  proxy,
  user_agent: useragent
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
    invariant(typeof uri === 'string', 'uri must be a string')
    options && invariant(typeof options === 'object', 'options must be an object')
    callback && invariant(typeof callback === 'function', 'callback must be a function')

    if (isOffline()) {
      return close(uri, withProxy(options), callback)
    }
    return needle[method](uri, withProxy(options), callback)
  }
})

'post put patch delete'.split(' ').forEach(function (method) {
  module.exports[method] = function (uri, data, options, callback) {
    invariant(typeof uri === 'string', 'uri must be a string')
    invariant(typeof data === 'object', 'data must be an object')
    options && invariant(typeof options === 'object', 'options must be an object')
    callback && invariant(typeof callback === 'function', 'callback must be a function')

    if (isOffline()) {
      return close(uri, data, withProxy(options), callback)
    }
    return needle[method](uri, data, withProxy(options), callback)
  }
})

module.exports.request = function (method, uri, data, options, callback) {
  invariant(typeof method === 'string', 'method must be a string')
  invariant(typeof uri === 'string', 'uri must be a string')
  invariant(typeof data === 'object', 'data must be an object')
  invariant(typeof options === 'object', 'options must be an object')
  callback && invariant(typeof callback === 'function', 'callback must be a function')

  if (isOffline()) {
    return close(method, uri, data, withProxy(options), callback)
  }
  return needle.request(method, uri, data, withProxy(options), callback)
}

function withProxy (options) {
  return {
    ...options,
    proxy: module.exports.proxy
  }
}

Promise.promisifyAll(module.exports)

module.exports.proxy = proxy
module.exports.proxySource = proxySource
