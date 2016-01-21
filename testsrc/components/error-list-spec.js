
let test = require('zopf')
let proxyquire = require('proxyquire')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

test('ErrorList', t => {
  let ErrorList = proxyquire('../../app/components/error-list', stubs)
  sd.shallowRender(sd(ErrorList, {errors: null}))
  sd.shallowRender(sd(ErrorList, {errors: 'uh oh'}))
  sd.shallowRender(sd(ErrorList, {errors: ['eenie', 'meenie']}))
})
