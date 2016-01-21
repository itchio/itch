
let test = require('zopf')
let proxyquire = require('proxyquire')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

test('LibraryPage', t => {
  let LibraryPage = proxyquire('../../app/components/library-page', stubs)
  sd.shallowRender(sd(LibraryPage, {}))
})
