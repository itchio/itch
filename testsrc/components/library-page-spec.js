
const test = require('zopf')
const proxyquire = require('proxyquire')

const sd = require('./skin-deeper')
const stubs = require('../stubs/react-stubs')

test('LibraryPage', t => {
  let LibraryPage = proxyquire('../../app/components/library-page', stubs)
  sd.shallowRender(sd(LibraryPage, {}))
})
