
const test = require('zopf')
const proxyquire = require('proxyquire')

const sd = require('./skin-deeper')
const stubs = require('../stubs/react-stubs')

test('ErrorList', t => {
  let ErrorList = proxyquire('../../app/components/error-list', stubs)
  sd.shallowRender(sd(ErrorList, {errors: null}))
  sd.shallowRender(sd(ErrorList, {errors: 'uh oh'}))
  sd.shallowRender(sd(ErrorList, {errors: ['eenie', 'meenie']}))
})
