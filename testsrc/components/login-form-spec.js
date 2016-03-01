
import test from 'zopf'
import proxyquire from 'proxyquire'

import sd from './skin-deeper'
import stubs from '../stubs/react-stubs'

test('LoginForm', t => {
  const LoginForm = proxyquire('../../app/components/login-form', stubs).default
  const state = {page: 'login'}

  const tree = sd.shallowRender(sd(LoginForm, {state}))
  const instance = tree.getMountedInstance()

  const fake_user = { value: () => 'marco' }
  instance.refs[`__proto__`].username = fake_user

  const fake_pass = { value: () => 'polo' }
  instance.refs[`__proto__`].password = fake_pass

  const mock = t.mock(stubs.AppActions)
  mock.expects('login_with_password').withArgs('marco', 'polo')

  const ev = { preventDefault: t.stub() }
  instance.handle_submit(ev)

  delete instance.refs[`__proto__`].username
  delete instance.refs[`__proto__`].password
})
