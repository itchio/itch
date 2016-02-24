
let test = require('zopf')
let proxyquire = require('proxyquire')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

test('LibraryContent', t => {
  let LibraryContent = proxyquire('../../app/components/library-content', stubs)
  let props = {
    library: {
      panel: ''
    }
  }
  sd.shallowRender(sd(LibraryContent, {state: props, games: {}}))
})
