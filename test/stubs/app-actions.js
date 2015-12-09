'use nodent';'use strict'

import proxyquire from 'proxyquire'
import electron from './electron'

let noop = () => null

let self = {
  '@noCallThru': true
}

let AppActions = proxyquire('../../app/actions/app-actions', electron)
Object.keys(AppActions).forEach((key) => {
  self[key] = noop
})

export default self
