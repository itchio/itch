
import test from 'zopf'
import proxyquire from 'proxyquire'

import sd from './skin-deeper'
import stubs from '../stubs/react-stubs'

test('LibrarySidebar', t => {
  const LibrarySidebar = proxyquire('../../app/components/library-sidebar', stubs).default
  const game = { title: 'Wreck IT' }
  const props = {
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
  sd.shallowRender(sd(LibrarySidebar, {state: props}))

  const tree = sd.shallowRender(sd(LibrarySidebar, {state: props}))
  t.ok(tree.findNode('.search'), 'displays search area')
})
