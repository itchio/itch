
import * as actions from '../actions'

import {pathToId} from '../util/navigation'

import {sortBy} from 'underline'

async function triggerMainAction (store, action) {
  const id = store.getState().session.navigation.id
  const data = store.getState().session.navigation.tabData[id]
  if (!data) {
    return
  }

  const {path} = data
  if (/^games/.test(path)) {
    const gameId = +pathToId(path)
    const game = (data.games || {})[gameId]
    if (game) {
      // FIXME: queueGame is a bit too tolerant
      store.dispatch(actions.queueGame({game}))
    }
  }
}

async function triggerOk (store, action) {
  const modals = store.getState().modals
  const [modal] = modals
  if (!modal) {
    const page = store.getState().session.navigation.page
    const picking = store.getState().session.login.picking
    if (page === 'gate' && picking) {
      const rememberedSessions = store.getState().rememberedSessions
      const mostRecentSession = rememberedSessions::sortBy((x) => -x.lastConnected)[0]
      if (mostRecentSession) {
        const {me, key} = mostRecentSession
        const {username} = me
        store.dispatch(actions.loginWithToken({username, key, me}))
      }
    }
    return
  }

  const [button] = modal.buttons
  if (!button) {
    return
  }

  const buttonAction = button.action

  if (buttonAction) {
    if (Array.isArray(buttonAction)) {
      for (const a of buttonAction) {
        store.dispatch(a)
      }
    } else {
      store.dispatch(buttonAction)
    }
  }
  store.dispatch(actions.closeModal())
}

async function triggerBack (store, action) {
  const modals = store.getState().modals
  const [modal] = modals
  if (!modal) {
    return
  }

  store.dispatch(actions.closeModal())
}

export default {triggerMainAction, triggerOk, triggerBack}
