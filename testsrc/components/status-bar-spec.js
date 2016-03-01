
import test from 'zopf'
import proxyquire from 'proxyquire'

import sd from './skin-deeper'
import stubs from '../stubs/react-stubs'

test('status-bar', t => {
  t.case('StatusBar', t => {
    // TODO: actually test it
    const StatusBar = proxyquire('../../app/components/status-bar', stubs).default
    sd.shallowRender(sd(StatusBar))
  })
})
