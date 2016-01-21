
let test = require('zopf')
let proxyquire = require('proxyquire')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

test('LoginPage', t => {
  let LoginPage = proxyquire('../../app/components/login-page', stubs)
  sd.shallowRender(sd(LoginPage, {}))
})
