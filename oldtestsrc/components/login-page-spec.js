
import test from 'zopf'
import sd from './skin-deeper'

import LoginPage from '../../app/components/login-page'

test('LoginPage', t => {
  sd.shallowRender(sd(LoginPage, {}))
})
