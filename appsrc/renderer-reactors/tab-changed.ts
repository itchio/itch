
import {IStore} from "../types";
import {IAction, ITabChangedPayload} from "../constants/action-types";

async function tabChanged (store: IStore, action: IAction<ITabChangedPayload>) {
  const {id} = action.payload;
  const item = document.querySelector(`.hub-sidebar-item[data-id='${id}']`);
  if (item) {
    item.scrollIntoView();
  }
}

export default {tabChanged};
