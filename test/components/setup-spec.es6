import test from 'zopf'
import mori from 'mori'
import proxyquire from 'proxyquire'
import sd from 'skin-deep'

import electron from '../stubs/electron'

let $ = require('react').createElement

test('SetupPage', t => {
  let {SetupPage} = proxyquire('../../app/components/setup', electron)

  let props = {
    icon: 'configure',
    message: 'Ah well'
  }

  t.case('renders', t => {
    sd.shallowRender($(SetupPage, {state: mori.toClj(props)}))
  })
})
