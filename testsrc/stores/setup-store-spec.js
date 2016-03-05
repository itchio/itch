
import test from 'zopf'
import proxyquire from 'proxyquire'

import AppConstants from '../../app/constants/app-constants'

import electron from '../stubs/electron'
import AppDispatcher from '../stubs/app-dispatcher'
import AppActions from '../stubs/app-actions'

test('SetupStore', t => {
  const ibrew = {
    __esModule: true,
    default: {
      fetch: () => null,
      bin_path: () => ''
    },
    '@noCallThru': true
  }

  const xdg_mime = {
    register_if_needed: async () => null
  }

  const stubs = Object.assign({
    '../util/ibrew': ibrew,
    '../util/xdg-mime': xdg_mime,
    '../actions/app-actions': AppActions,
    '../dispatcher/app-dispatcher': AppDispatcher
  }, electron)

  proxyquire('../../app/stores/setup-store', stubs)
  const handler = AppDispatcher.get_handler('setup-store')

  t.case('window_ready', async t => {
    t.stub(ibrew.default, 'fetch').resolves()
    await handler({action_type: AppConstants.WINDOW_READY})
  })

  t.case('window_ready (err)', async t => {
    t.stub(ibrew.default, 'fetch', async (opts, name) => {
      if (name === 'butler') {
        let err = {stack: 'Ha!'}
        throw err
      }
    })
    t.mock(AppActions).expects('setup_status').withArgs('login.status.setup_failure', 'error', {error: 'Ha!'})
    await handler({action_type: AppConstants.WINDOW_READY})
  })
})
