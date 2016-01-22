
let test = require('zopf')
let proxyquire = require('proxyquire')

let AppConstants = require('../../app/constants/app-constants')

let electron = require('../stubs/electron')
let AppDispatcher = require('../stubs/app-dispatcher')
let AppActions = require('../stubs/app-actions')

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
