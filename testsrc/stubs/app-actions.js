
import proxyquire from 'proxyquire'
import electron from './electron'

const noop = () => null

const self = {
  '@noCallThru': true
}

const AppActions = proxyquire('../../app/actions/app-actions', electron).default
Object.keys(AppActions).forEach((key) => {
  self[key] = noop
})

export default self
