
let test = require('zopf')
let proxyquire = require('proxyquire')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

test('Search', t => {
  let SearchContent = proxyquire('../../app/components/search', stubs)
  sd.shallowRender(sd(SearchContent, {}))
})
