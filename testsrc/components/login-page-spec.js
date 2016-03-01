
import test from 'zopf'
import proxyquire from 'proxyquire'

import sd from './skin-deeper'
import stubs from '../stubs/react-stubs'

test('LoginPage', t => {
  const LoginPage = proxyquire('../../app/components/login-page', stubs).default
  sd.shallowRender(sd(LoginPage, {}))
})
