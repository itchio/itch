
import {each} from 'underline'

import * as actions from '../actions'

async function closeModal (store, outerAction) {
  const {action} = outerAction.payload
  const modal = store.getState().modals[0]

  if (action) {
    if (Array.isArray(action)) {
      action::each((a) => store.dispatch(a))
    } else {
      store.dispatch(action)
    }
  }

  store.dispatch(actions.modalClosed({id: modal.id, action: action || {}}))
}

// look, so this probably breaks the spirit of redux, not denying it,
// but also, redux has a pretty strong will, I'm sure it'll recover.

const modalResolves = {}

export function promisedModal (store, payload) {
  const modalAction = actions.openModal(payload)
  const {id} = modalAction.payload

  const p = new Promise((resolve) => {
    modalResolves[id] = resolve
  })

  store.dispatch(modalAction)
  return p
}

async function modalClosed (store, outerAction) {
  const {id, action} = outerAction.payload

  const resolve = modalResolves[id]
  if (resolve) {
    resolve(action)
  }
}

export default {closeModal, modalClosed}
