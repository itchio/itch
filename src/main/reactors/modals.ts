import { Watcher } from "common/util/watcher";
import { actions } from "common/actions";

import { each, findWhere } from "underscore";

import { Store } from "common/types";

import modalResolves from "main/reactors/modals-persistent-state";
import { TypedModal } from "common/modals";

// look, so this probably breaks the spirit of redux, not denying it,
// but also, redux has a pretty strong will, I'm sure it'll recover.

export async function promisedModal<Params, Response>(
  store: Store,
  payload: TypedModal<Params, Response>
): Promise<Response> {
  const modalAction = actions.openModal(payload);
  const { id } = modalAction.payload;

  const p = new Promise<any>((resolve) => {
    modalResolves[id] = resolve;
  });

  store.dispatch(modalAction);
  return await p;
}

export default function (watcher: Watcher) {
  watcher.on(actions.closeModal, async (store, outerAction) => {
    const { payload } = outerAction;
    const { wind, action, id } = payload;

    const modals = store.getState().winds[wind].modals;
    let modal = modals[0];
    if (id) {
      modal = findWhere(modals, { id });
    }

    let response: any = null;
    if (action) {
      if (Array.isArray(action)) {
        each(action, (a) => store.dispatch(a));
      } else {
        store.dispatch(action);
        if (action.type === "modalResponse") {
          response = action.payload;
        }
      }
    }

    store.dispatch(
      actions.modalClosed({
        wind,
        id: modal ? modal.id : id,
        response,
      })
    );
  });

  watcher.on(actions.modalClosed, async (store, outerAction) => {
    const { id, response } = outerAction.payload;

    const resolve = modalResolves[id];
    if (resolve) {
      resolve(response);
    }
  });
}
