
const test = require('zopf')
const proxyquire = require('proxyquire')

const sd = require('./skin-deeper')
const stubs = require('../stubs/react-stubs')

test('status-bar', t => {
  t.case('StatusBar', t => {
    // TODO: actually test it
    let StatusBar = proxyquire('../../app/components/status-bar', stubs)
    sd.shallowRender(sd(StatusBar))
  })
})
