'use nodent';'use strict'

import Promise from 'bluebird'
import proxyquire from 'proxyquire'
import electron from './electron'

let noop = () => Promise.resolve()

let self = {
  '@noCallThru': true
}

let db = proxyquire('../../app/util/db', electron)
Object.keys(db).forEach((key) => {
  self[key] = noop
})

export default self
