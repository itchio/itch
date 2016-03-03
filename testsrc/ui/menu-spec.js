
import test from 'zopf'
import proxyquire from 'proxyquire'
import {findWhere} from 'underline'

import electron from '../stubs/electron'
import AppActions from '../stubs/app-actions'
import CredentialsStore from '../stubs/credentials-store'
import I18nStore from '../stubs/i18n-store'

const collect_actions = (template) => {
  const actions = {}
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
  const crash_reporter = test.module({
    report_issue: () => null
  })

  const stubs = Object.assign({
    '../actions/app-actions': AppActions,
    '../stores/credentials-store': CredentialsStore,
    '../stores/i18n-store': I18nStore,
    '../util/crash-reporter': crash_reporter
  }, electron)

  let template
  t.stub(electron.electron.Menu, 'buildFromTemplate', (t) => template = t)

  const menu = proxyquire('../../app/ui/menu', stubs).default

  let handler
  t.stub(CredentialsStore, 'add_change_listener', (e, h) => handler = h)

  t.case('mount', t => {
    menu.mount()
    t.ok(handler)
    handler()
  })

  t.case('actions', t => {
    const actions = collect_actions(template)
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
    const res = template::findWhere({label: 'menu.account.account'}).submenu[0].label
    t.same(res, 'menu.account.not_logged_in')
  })

  t.case('logged in', t => {
    t.stub(CredentialsStore, 'get_current_user').returns({totally: 'legit'})
    handler()
    const res = template::findWhere({label: 'menu.account.account'}).submenu[0].label
    t.same(res, 'menu.account.change_user')
  })
})
