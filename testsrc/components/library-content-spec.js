
const test = require('zopf')
const proxyquire = require('proxyquire')

const sd = require('./skin-deeper')
const stubs = require('../stubs/react-stubs')

test('LibraryContent', t => {
  let LibraryContent = proxyquire('../../app/components/library-content', stubs)
  let props = {
    library: {
      panel: ''
    }
  }
  sd.shallowRender(sd(LibraryContent, {state: props, games: {}}))
})
