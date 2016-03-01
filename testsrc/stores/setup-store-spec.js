
const test = require('zopf')
const proxyquire = require('proxyquire')

const AppConstants = require('../../app/constants/app-constants')

const electron = require('../stubs/electron')
const AppDispatcher = require('../stubs/app-dispatcher')
const AppActions = require('../stubs/app-actions')

test('SetupStore', t => {
  let ibrew = {
    fetch: () => null
  }

  let xdg_mime = {
    register_if_needed: async () => null
  }

  let stubs = Object.assign({
    '../util/ibrew': ibrew,
    '../util/xdg-mime': xdg_mime,
    '../actions/app-actions': AppActions,
    '../dispatcher/app-dispatcher': AppDispatcher
  }, electron)

  proxyquire('../../app/stores/setup-store', stubs)
  let handler = AppDispatcher.get_handler('setup-store')

  t.case('window_ready', async t => {
    t.stub(ibrew, 'fetch').resolves()
    await handler({ action_type: AppConstants.WINDOW_READY })
  })

  t.case('window_ready (err)', async t => {
    t.stub(ibrew, 'fetch', async (opts, name) => {
      if (name === 'butler') {
        let err = {stack: 'Ha!'}
        throw err
      }
    })
    t.mock(AppActions).expects('setup_status').withArgs('login.status.setup_failure', 'error', { error: 'Ha!' })
    await handler({ action_type: AppConstants.WINDOW_READY })
  })
})
