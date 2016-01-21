
let test = require('zopf')
let proxyquire = require('proxyquire')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

test('LibraryPanelLink', t => {
  let LibraryPanelLink = proxyquire('../../app/components/library-panel-link', stubs)
  sd.shallowRender(sd(LibraryPanelLink, {}))
})
