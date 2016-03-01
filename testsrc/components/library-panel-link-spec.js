
import test from 'zopf'
import proxyquire from 'proxyquire'

import sd from './skin-deeper'
import stubs from '../stubs/react-stubs'

test('LibraryPanelLink', t => {
  const LibraryPanelLink = proxyquire('../../app/components/library-panel-link', stubs).default
  sd.shallowRender(sd(LibraryPanelLink, {}))
})
