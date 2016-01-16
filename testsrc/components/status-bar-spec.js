
let test = require('zopf')
let proxyquire = require('proxyquire')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

test('status-bar', t => {
  t.case('StatusBar', t => {
    // TODO: actually test it
    let StatusBar = proxyquire('../../app/components/status-bar', stubs)
    sd.shallowRender(sd(StatusBar))
  })
})
