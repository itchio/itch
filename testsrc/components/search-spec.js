
import test from 'zopf'
import sd from './skin-deeper'

import SearchContent from '../../app/components/search'

test('Search', t => {
  sd.shallowRender(sd(SearchContent, {}))
})
