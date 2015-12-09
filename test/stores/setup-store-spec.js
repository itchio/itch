'use nodent';'use strict'
import test from 'zopf'
import proxyquire from 'proxyquire'

import AppConstants from '../../app/constants/app-constants'

import electron from '../stubs/electron'
import AppDispatcher from '../stubs/app-dispatcher'
import AppActions from '../stubs/app-actions'

let setup = t => {
  let ibrew = {
    fetch: () => null
  }
  let stubs = Object.assign({
    '../util/ibrew': ibrew,
    '../actions/app-actions': AppActions,
    '../dispatcher/app-dispatcher': AppDispatcher
  }, electron)

  proxyquire('../../app/stores/setup-store', stubs)
  let handler = AppDispatcher.get_handler('setup-store')
  return {handler, ibrew}
}

test('SetupStore', t => {
  let {handler, ibrew} = setup(t)

  t.case('window_ready', t => {
    t.stub(ibrew, 'fetch').resolves()
    handler({ action_type: AppConstants.WINDOW_READY })
  })

  t.case('window_ready (err)', t => {
    t.stub(ibrew, 'fetch').returns(Promise.reject('Ha!'))
    t.mock(AppActions).expects('setup_status').withArgs('Ha!', 'error')
    handler({ action_type: AppConstants.WINDOW_READY })
    return new Promise((resolve, reject) => setTimeout(resolve, 20))
  })
})
