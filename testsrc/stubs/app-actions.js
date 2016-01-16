
let proxyquire = require('proxyquire')
let electron = require('./electron')

let noop = () => null

let self = {
  '@noCallThru': true
}

let AppActions = proxyquire('../../app/actions/app-actions', electron)
Object.keys(AppActions).forEach((key) => {
  self[key] = noop
})

module.exports = self
