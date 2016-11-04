
import {each} from "underscore";

import * as actions from "../actions";

import {IStore} from "../types/db";
import {IAction, IOpenModalPayload, IModalClosedPayload} from "../constants/action-types";

async function closeModal (store: IStore, outerAction: IAction<any>) {
  const {payload = {}} = outerAction;
  const {action} = payload;
  const modal = store.getState().modals[0];

  if (action) {
    if (Array.isArray(action)) {
      each(action, (a) => store.dispatch(a));
    } else {
      store.dispatch(action);
    }
  }

  store.dispatch(actions.modalClosed({
    id: modal.id,
    action: action || {},
  }));
}

// look, so this probably breaks the spirit of redux, not denying it,
// but also, redux has a pretty strong will, I'm sure it'll recover.

interface IModalResolveMap {
  [modalId: string]: (action: any) => void;
}
const modalResolves: IModalResolveMap = {};

export function promisedModal (store: IStore, payload: IOpenModalPayload) {
  const modalAction = actions.openModal(payload);
  const {id} = modalAction.payload;

  const p = new Promise((resolve) => {
    modalResolves[id] = resolve;
  });

  store.dispatch(modalAction);
  return p;
}

async function modalClosed (store: IStore, outerAction: IAction<IModalClosedPayload>) {
  const {id, action} = outerAction.payload;

  const resolve = modalResolves[id];
  if (resolve) {
    resolve(action);
  }
}

export default {closeModal, modalClosed};
