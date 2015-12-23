
let test = require('zopf')
let proxyquire = require('proxyquire')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

test('login', t => {
  let login = proxyquire('../../app/components/login', stubs)
  let LoginPage = login.LoginPage
  let LoginForm = login.LoginForm

  t.case('LoginPage', t => {
    sd.shallowRender(sd(LoginPage, {}))
  })

  t.case('LoginForm', t => {
    let tree = sd.shallowRender(sd(LoginForm, {}))
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
