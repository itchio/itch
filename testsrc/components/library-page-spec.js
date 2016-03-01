
import test from 'zopf'
import proxyquire from 'proxyquire'

import sd from './skin-deeper'
import stubs from '../stubs/react-stubs'

test('LibraryPage', t => {
  const LibraryPage = proxyquire('../../app/components/library-page', stubs).default
  sd.shallowRender(sd(LibraryPage, {}))
})
