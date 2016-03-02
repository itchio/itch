
import test from 'zopf'
import sd from './skin-deeper'

import StatusBar from '../../app/components/status-bar'

test('status-bar', t => {
  t.case('StatusBar', t => {
    // TODO: actually test it
    sd.shallowRender(sd(StatusBar))
  })
})
