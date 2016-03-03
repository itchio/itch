
import test from 'zopf'
import sd from './skin-deeper'

import LibraryPanelLink from '../../app/components/library-panel-link'

test('LibraryPanelLink', t => {
  sd.shallowRender(sd(LibraryPanelLink, {}))
})
