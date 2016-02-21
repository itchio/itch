
let test = require('zopf')
let mori = require('mori')
let proxyquire = require('proxyquire')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

test('LibrarySidebar', t => {
  let LibrarySidebar = proxyquire('../../app/components/library-sidebar', stubs)
  let game = { title: 'Wreck IT' }
  let props = {
    collections: {
      a: {title: 'Collection A'},
      b: {title: 'Collection B'}
    },
    installs: {
      c: {task: 'download', progress: 0.2, game},
      d: {task: 'extract', progress: 0.7, game},
      e: {task: 'error', error: 'dun goofed', game},
      f: {task: 'idle', game}
    },
    library: {
      panel: ''
    }
  }
  sd.shallowRender(sd(LibrarySidebar, {state: mori.toClj(props)}))

  let tree = sd.shallowRender(sd(LibrarySidebar, {state: mori.toClj(props)}))
  t.ok(tree.findNode('.search'), 'displays search area')
})
