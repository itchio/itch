
import {createSelector} from 'reselect'

import * as actions from '../actions'

async function logout (store) {
  store.dispatch(actions.switchPage('gate'))
}

async function sessionReady (store) {
  const me = store.getState().session.credentials.me
  if (me.developer) {
    store.dispatch(actions.unlockTab({path: 'dashboard'}))
  }

  setTimeout(function () {
    store.dispatch(actions.switchPage('hub'))
  }, 1000)
}

let sessionSelector
const makeSessionSelector = (store) => createSelector(
  (state) => state.setup.done,
  (state) => state.market.ready,
  (state) => state.session.credentials.key,
  (setupDone, marketReady, loginDone) => {
    if (setupDone && marketReady && loginDone) {
      store.dispatch(actions.sessionReady())
    }
  }
)

async function catchAll (store) {
  if (!sessionSelector) {
    sessionSelector = makeSessionSelector(store)
  }
  sessionSelector(store.getState())
}

export default {sessionReady, logout, catchAll}
