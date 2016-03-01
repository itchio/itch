
import test from 'zopf'
import proxyquire from 'proxyquire'

import sd from './skin-deeper'
import stubs from '../stubs/react-stubs'

test('LibraryContent', t => {
  const LibraryContent = proxyquire('../../app/components/library-content', stubs).default
  const props = {
    library: {
      panel: ''
    }
  }
  sd.shallowRender(sd(LibraryContent, {state: props, games: {}}))
})
