
import Promise from 'bluebird'
import {map, each} from 'underline'

import {opts} from '../logger'
import mklog from '../util/log'
const log = mklog('reactors')

export default function combine (...args) {
  const methods = args::map((x) => {
    if (!x) throw new Error('null reactor in combination')
    return Promise.method(x)
  })

  return (store, action) => {
    methods::each(async function (method) {
      try {
        await method(store, action)
      } catch (e) {
        log(opts, `while reacting to ${(action || {type: '?'}).type}: ${e.stack || e}`)
      }
    })
  }
}
