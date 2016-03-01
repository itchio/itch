
const test = require('zopf')
const proxyquire = require('proxyquire')

const sd = require('./skin-deeper')
const stubs = require('../stubs/react-stubs')

test('Search', t => {
  let SearchContent = proxyquire('../../app/components/search', stubs)
  sd.shallowRender(sd(SearchContent, {}))
})
