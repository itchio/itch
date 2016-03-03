
import test from 'zopf'
import sd from './skin-deeper'

import LibraryPage from '../../app/components/library-page'

test('LibraryPage', t => {
  sd.shallowRender(sd(LibraryPage, {}))
})
