
import {Watcher} from "../reactors/watcher";
import * as actions from "../actions";

export default function (watcher: Watcher) {
  watcher.on(actions.tabChanged, async (store, action) => {
    const {id} = action.payload;
    const item = document.querySelector(`.hub-sidebar-item[data-id='${id}']`);
    if (item) {
      item.scrollIntoView();
    }
  });
}
