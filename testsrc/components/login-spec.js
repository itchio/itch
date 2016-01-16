
let test = require('zopf')
let mori = require('mori')
let proxyquire = require('proxyquire')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

test('login', t => {
  let state = mori.hashMap('page', 'login')

  t.case('LoginPage', t => {
    let LoginPage = proxyquire('../../app/components/login-page', stubs)
    sd.shallowRender(sd(LoginPage, {state}))
  })

  t.case('LoginForm', t => {
    let LoginForm = proxyquire('../../app/components/login-form', stubs)
    let tree = sd.shallowRender(sd(LoginForm, {state}))
    let instance = tree.getMountedInstance()

    let fake_user = { value: () => 'marco' }
    instance.refs[`__proto__`].username = fake_user

    let fake_pass = { value: () => 'polo' }
    instance.refs[`__proto__`].password = fake_pass

    let mock = t.mock(stubs.AppActions)
    mock.expects('login_with_password').withArgs('marco', 'polo')

    let ev = { preventDefault: t.stub() }
    instance.handle_submit(ev)

    delete instance.refs[`__proto__`].username
    delete instance.refs[`__proto__`].password
  })
})
