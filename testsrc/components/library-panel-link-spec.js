
const test = require('zopf')
const proxyquire = require('proxyquire')

const sd = require('./skin-deeper')
const stubs = require('../stubs/react-stubs')

test('LibraryPanelLink', t => {
  let LibraryPanelLink = proxyquire('../../app/components/library-panel-link', stubs)
  sd.shallowRender(sd(LibraryPanelLink, {}))
})
