
import test from 'zopf'
import proxyquire from 'proxyquire'

import AppConstants from '../../app/constants/app-constants'

import electron from '../stubs/electron'
import AppDispatcher from '../stubs/app-dispatcher'
import AppActions from '../stubs/app-actions'
import config from '../stubs/config'
import api from '../stubs/api'
import defer from '../stubs/defer'

test('CredentialsStore', t => {
  const SetupStore = {
    __esModule: true,
    default: {
      is_ready: () => true
    },
    '@noCallThru': true
  }

  const stubs = Object.assign({
    '../util/defer': defer,
    '../util/config': config,
    '../util/api': api,
    '../actions/app-actions': AppActions,
    '../dispatcher/app-dispatcher': AppDispatcher,
    './setup-store': SetupStore
  }, electron)

  const CredentialsStore = proxyquire('../../app/stores/credentials-store', stubs).default
  const handler = AppDispatcher.get_handler('credentials-store')

  t.case('window_ready (no credentials)', t => {
    t.mock(AppActions).expects('no_stored_credentials')
    return handler({ action_type: AppConstants.WINDOW_READY })
  })

  t.case('login with key + logout', async t => {
    const user = {name: 'Pete'}
    t.mock(AppActions).expects('authenticated')
    t.stub(config, 'get').returns('numazu')
    t.stub(api.client, 'login_key').resolves({user})

    await handler({ action_type: AppConstants.WINDOW_READY })
    t.ok(CredentialsStore.get_current_user(), 'has current user after setup')
    t.same(CredentialsStore.get_me(), user, 'has me after setup')

    handler({ action_type: AppConstants.LOGOUT })
    t.notOk(CredentialsStore.get_current_user(), 'no current user after logout')
    t.notOk(CredentialsStore.get_me(), 'no me after setup')
  })

  t.case('login with password', async t => {
    const user = {name: 'Pete'}
    const username = 'foo'
    const password = 'bar'
    const key = 'numazu'

    t.mock(AppActions).expects('authenticated')
    t.stub(api.client, 'login_with_password').resolves({key: {key}})
    t.stub(api.user, 'me').resolves({user})

    await handler({ action_type: AppConstants.LOGIN_WITH_PASSWORD, username, password })

    t.ok(CredentialsStore.get_current_user())
    t.same(CredentialsStore.get_me(), user)
  })
})
