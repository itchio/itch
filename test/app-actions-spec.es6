import test from 'zopf'
import proxyquire from 'proxyquire'

import electron from './stubs/electron'

let setup = t => {
  let app_dispatcher = {
    dispatch: () => null
  }
  let stubs = Object.assign({
    '../dispatcher/app-dispatcher': app_dispatcher
  }, electron)
  let app_actions = proxyquire('../app/actions/app-actions', stubs)
  return {app_actions, app_dispatcher}
}

test('app-actions', t => {
  let {app_actions, app_dispatcher} = setup(t)

  let test_action = (name, args, object) => {
    t.case(name, t => {
      t.mock(app_dispatcher).expects('dispatch').withArgs(object)
      app_actions[name].apply(app_actions, args)
    })
  }

  test_action('boot', [], { action_type: 'BOOT' })
  test_action('quit', [], { action_type: 'QUIT' })
  test_action('focus_panel', ['waz'], { action_type: 'LIBRARY_FOCUS_PANEL', panel: 'waz' })
  test_action('focus_window', [], { action_type: 'FOCUS_WINDOW' })
  test_action('hide_window', [], { action_type: 'HIDE_WINDOW' })
  test_action('login_with_password', ['might', 'magic'], { action_type: 'LOGIN_WITH_PASSWORD', username: 'might', password: 'magic' })
  test_action('authenticated', ['zaw'], { action_type: 'AUTHENTICATED', key: 'zaw' })
  test_action('logout', [], { action_type: 'LOGOUT' })
  test_action('logout_done', [], { action_type: 'LOGOUT_DONE' })
  test_action('download_queue', [{a: 'b'}], { action_type: 'DOWNLOAD_QUEUE', opts: {a: 'b'} })
  test_action('install_progress', [{a: 'b'}], { action_type: 'INSTALL_PROGRESS', opts: {a: 'b'} })
  test_action('set_progress', [0.5], { action_type: 'SET_PROGRESS', alpha: 0.5 })
  test_action('clear_progress', [], { action_type: 'CLEAR_PROGRESS' })
  test_action('bounce', [], { action_type: 'BOUNCE' })
  test_action('notify', ['les carottes sont cuites'], { action_type: 'NOTIFY', message: 'les carottes sont cuites' })
})
