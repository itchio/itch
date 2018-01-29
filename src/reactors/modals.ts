import { Watcher } from "./watcher";
import { actions } from "../actions";

import { each, findWhere } from "underscore";

import { IStore, IAction } from "../types";

import modalResolves from "./modals-persistent-state";

// look, so this probably breaks the spirit of redux, not denying it,
// but also, redux has a pretty strong will, I'm sure it'll recover.

export function promisedModal(
  store: IStore,
  payload: typeof actions.openModal.payload
) {
  const modalAction = actions.openModal(payload);
  const { id } = modalAction.payload;

  const p = new Promise<
    IAction<typeof actions.modalResponse.payload>
  >(resolve => {
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
