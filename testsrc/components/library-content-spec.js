
import test from 'zopf'
import sd from './skin-deeper'

import LibraryContent from '../../app/components/library-content'

test('LibraryContent', t => {
  const props = {
    library: {
      panel: ''
    }
  }
  sd.shallowRender(sd(LibraryContent, {state: props, games: {}}))
})
