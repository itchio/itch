
import test from 'zopf'
import proxyquire from 'proxyquire'

import sd from './skin-deeper'
import stubs from '../stubs/react-stubs'

test('Search', t => {
  const SearchContent = proxyquire('../../app/components/search', stubs).default
  sd.shallowRender(sd(SearchContent, {}))
})
