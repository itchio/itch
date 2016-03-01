
const test = require('zopf')
const proxyquire = require('proxyquire')

const sd = require('./skin-deeper')
const stubs = require('../stubs/react-stubs')

test('LoginPage', t => {
  let LoginPage = proxyquire('../../app/components/login-page', stubs)
  sd.shallowRender(sd(LoginPage, {}))
})
