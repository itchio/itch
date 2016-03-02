
import test from 'zopf'
import proxyquire from 'proxyquire'
import electron from './electron'

const noop = () => null
const self = {}

const AppActions = proxyquire('../../app/actions/app-actions', electron).default
Object.keys(AppActions).forEach((key) => {
  self[key] = noop
})

module.exports = test.module(self)
