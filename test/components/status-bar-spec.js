
let test = require('zopf')
let proxyquire = require('proxyquire')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

test('status-bar', t => {
  let StatusBar = proxyquire('../../app/components/status-bar', stubs)

  // TODO: test different statuses
  t.case('StatusBar', t => {
    sd.shallowRender(sd(StatusBar))
  })
})
