import { Watcher } from "./watcher";
import * as actions from "../actions";

import { each, findWhere } from "underscore";

import { IStore } from "../types";
import {
  IAction,
  IOpenModalPayload,
  IModalResponsePayload,
} from "../constants/action-types";

import modalResolves from "./modal-resolves";

// look, so this probably breaks the spirit of redux, not denying it,
// but also, redux has a pretty strong will, I'm sure it'll recover.

export function promisedModal(store: IStore, payload: IOpenModalPayload) {
  const modalAction = actions.openModal(payload);
  const { id } = modalAction.payload;

  const p = new Promise<IAction<IModalResponsePayload>>(resolve => {
    modalResolves[id] = resolve;
  });

  store.dispatch(modalAction);
  return p;
}

export default function(watcher: Watcher) {
  watcher.on(actions.closeModal, async (store, outerAction) => {
    const { payload = {} } = outerAction;
    const { action, id } = payload;

    const modals = store.getState().modals;
    let modal = modals[0];
    if (id) {
      modal = findWhere(modals, { id });
    }

    if (action) {
      if (Array.isArray(action)) {
        each(action, a => store.dispatch(a));
      } else {
        store.dispatch(action);
      }
    }

    store.dispatch(
      actions.modalClosed({
        id: modal ? modal.id : id,
        action,
      })
    );
  });

  watcher.on(actions.modalClosed, async (store, outerAction) => {
    const { id, action } = outerAction.payload;

    const resolve = modalResolves[id];
    if (resolve) {
      resolve(action || actions.modalNoResponse({}));
    }
  });
}
