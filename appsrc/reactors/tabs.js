
import uuid from 'node-uuid'

import * as actions from '../actions'

async function applyTabOffset (store, offset) {
  const {id, tabs} = store.getState().session.navigation
  const {constant, transient} = tabs

  const ids = constant.concat(transient)
  const numTabs = ids.length

  const index = ids.indexOf(id)

  // adding numPaths takes care of negative wrapping too!
  const newIndex = (index + offset + numTabs) % numTabs
  const newId = ids[newIndex]

  store.dispatch(actions.navigate(newId))
}

async function newTab (store, action) {
  store.dispatch(actions.navigate('new/' + uuid.v4()))
}

async function focusNthTab (store, action) {
  const n = action.payload
  const constant = store.getState().session.navigation.tabs.constant
  const tab = constant[n - 1]
  if (tab) {
    store.dispatch(actions.navigate(tab))
  }
}

async function showPreviousTab (store) {
  await applyTabOffset(store, -1)
}

async function showNextTab (store) {
  await applyTabOffset(store, 1)
}

export default {newTab, focusNthTab, showPreviousTab, showNextTab}
