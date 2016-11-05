
import {clipboard} from "../electron";

import * as actions from "../actions";

import {IStore} from "../types";
import {IAction, ICopyToClipboardPayload} from "../constants/action-types";

async function copyToClipboard (store: IStore, action: IAction<ICopyToClipboardPayload>) {
  clipboard.writeText(action.payload);
  store.dispatch(actions.statusMessage(["status.copied_to_clipboard"]));
}

export default {copyToClipboard};
