import test from 'zopf'
import proxyquire from 'proxyquire'
import sd from 'skin-deep'

import electron from '../stubs/electron'
import AppActions from '../stubs/app-actions'

let $ = require('react').createElement

test('user-panel', t => {
  let stubs = Object.assign({
    '../actions/app-actions': AppActions
  }, electron)
  let {LoginPage, LoginForm} = proxyquire('../../app/components/login', stubs)

  t.case('LoginPage', t => {
    sd.shallowRender($(LoginPage, {}))
  })

  t.case('LoginForm', t => {
    let tree = sd.shallowRender($(LoginForm, {}))
    let instance = tree.getMountedInstance()

    let fake_user = { value: () => 'marco' }
    instance.refs[`__proto__`].username = fake_user

    let fake_pass = { value: () => 'polo' }
    instance.refs[`__proto__`].password = fake_pass

    let mock = t.mock(AppActions)
    mock.expects('login_with_password').withArgs('marco', 'polo')

    let ev = { preventDefault: t.stub() }
    instance.handle_submit(ev)

    delete instance.refs[`__proto__`].username
    delete instance.refs[`__proto__`].password
  })
})
