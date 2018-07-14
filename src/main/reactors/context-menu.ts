import { Watcher } from "common/util/watcher";

import { Store, MenuTemplate, IOpenContextMenuBase } from "common/types";

import { actions } from "common/actions";

import { gameControls } from "main/reactors/context-menu/build-template";

function openMenu(
  store: Store,
  template: MenuTemplate,
  base: IOpenContextMenuBase
) {
  if (template.length === 0) {
    // don't show empty context menus
    return;
  }
  store.dispatch(actions.popupContextMenu({ template, ...base }));
}

export default function(watcher: Watcher) {
  watcher.on(actions.openGameContextMenu, async (store, action) => {
    const { game } = action.payload;
    const template = gameControls(store, game);

    const { wind, clientX, clientY } = action.payload;
    openMenu(store, template, { wind, clientX, clientY });
  });
}
