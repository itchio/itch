'use nodent';'use strict'
let test = require('zopf')
let proxyquire = require('proxyquire')
let sd = require('skin-deep')

let electron = require('../stubs/electron')
let AppActions = require('../stubs/app-actions')

let $ = require('react').createElement

test('user-panel', t => {
  let stubs = Object.assign({
    '../actions/app-actions': AppActions
  }, electron)
  let login = proxyquire('../../app/components/login', stubs)
  let LoginPage = login.LoginPage
  let LoginForm = login.LoginForm

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
