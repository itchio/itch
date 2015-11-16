import test from 'zopf'
import proxyquire from 'proxyquire'

import electron from '../stubs/electron'

let setup = t => {
  let app_dispatcher = {
    dispatch: () => null
  }
  let stubs = Object.assign({
    '../dispatcher/app-dispatcher': app_dispatcher
  }, electron)
  let app_actions = proxyquire('../../app/actions/app-actions', stubs)
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

  test_action('no_stored_credentials', [], { action_type: 'NO_STORED_CREDENTIALS' })
  test_action('login_with_password', ['might', 'magic'], { action_type: 'LOGIN_WITH_PASSWORD', username: 'might', password: 'magic', private: true })
  test_action('login_failure', [['might', 'magic']], { action_type: 'LOGIN_FAILURE', errors: ['might', 'magic'] })
  test_action('authenticated', [], { action_type: 'AUTHENTICATED' })
  test_action('logout', [], { action_type: 'LOGOUT' })

  test_action('cave_queue', [42], { action_type: 'CAVE_QUEUE', game_id: 42 })
  test_action('cave_update', [42, {a: 'b'}], { action_type: 'CAVE_UPDATE', id: 42, data: {a: 'b'} })
  test_action('cave_progress', [{a: 'b'}], { action_type: 'CAVE_PROGRESS', opts: {a: 'b'} })
  test_action('set_progress', [0.5], { action_type: 'SET_PROGRESS', alpha: 0.5 })
  test_action('bounce', [], { action_type: 'BOUNCE' })
  test_action('notify', ['les carottes sont cuites'], { action_type: 'NOTIFY', message: 'les carottes sont cuites' })

  test_action('fetch_games', ['collections/23498'], { action_type: 'FETCH_GAMES', path: 'collections/23498' })

  test_action('eval', ['alert("Hi")'], { action_type: 'EVAL', code: 'alert("Hi")' })
})
