

let test = require('zopf')
let proxyquire = require('proxyquire')
let jspath = require('jspath')

let electron = require('../stubs/electron')
let AppActions = require('../stubs/app-actions')
let CredentialsStore = require('../stubs/credentials-store')

let collect_actions = (template) => {
  let actions = {}
  template.forEach((item) => {
    if (item.click) {
      actions[item.label] = item.click
    }
    if (item.submenu) {
      Object.assign(actions, collect_actions(item.submenu))
    }
  })
  return actions
}

test('menu', t => {
  let stubs = Object.assign({
    '../actions/app-actions': AppActions,
    '../stores/credentials-store': CredentialsStore
  }, electron)

  let template
  t.stub(electron.electron.Menu, 'buildFromTemplate', (t) => template = t)

  let menu = proxyquire('../../app/ui/menu', stubs)
  let handler
  t.stub(CredentialsStore, 'add_change_listener', (e, h) => handler = h)

  t.case('mount', t => {
    menu.mount()
    t.ok(handler)
    handler()
  })

  t.case('actions', t => {
    let actions = collect_actions(template)
    Object.keys(actions).forEach((action) => {
      if (action === 'Provoke crash') {
        t.throws(() => actions[action]())
      } else {
        actions[action]()
      }
    })
  })

  t.case('logged out', t => {
    t.stub(CredentialsStore, 'get_current_user').returns(null)
    handler()
    let res = jspath.apply('.{.label === "Account"}.submenu.label', template)
    t.same('Not logged in', res[0])
  })

  t.case('logged in', t => {
    t.stub(CredentialsStore, 'get_current_user').returns({totally: 'legit'})
    handler()
    let res = jspath.apply('.{.label === "Account"}.submenu.label', template)
    t.same('Change user...', res[0])
  })
})
