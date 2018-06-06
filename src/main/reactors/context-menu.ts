import { Watcher } from "common/util/watcher";

import { IStore, IMenuTemplate, IOpenContextMenuBase } from "common/types";

import { actions } from "common/actions";

import { Space } from "common/helpers/space";
import {
  gameControls,
  newTabControls,
  concatTemplates,
  closeTabControls,
} from "./context-menu/build-template";

function openMenu(
  store: IStore,
  template: IMenuTemplate,
  base: IOpenContextMenuBase
) {
  if (template.length === 0) {
    // don't show empty context menus
    return;
  }
  store.dispatch(actions.popupContextMenu({ template, ...base }));
}

export default function(watcher: Watcher) {
  watcher.on(actions.openTabContextMenu, async (store, action) => {
    const { window, tab } = action.payload;

    let template: IMenuTemplate;
    template = concatTemplates(template, newTabControls(store, window, tab));

    const sp = Space.fromStore(store, window, tab);
    if (sp.prefix === "games") {
      const game = sp.game();
      if (game && game.id) {
        template = concatTemplates(template, gameControls(store, game));
      }
    }

    template = concatTemplates(template, closeTabControls(store, window, tab));
    const { clientX, clientY } = action.payload;
    openMenu(store, template, { window, clientX, clientY });
  });

  watcher.on(actions.openGameContextMenu, async (store, action) => {
    const { game } = action.payload;
    const template = gameControls(store, game);

    const { window, clientX, clientY } = action.payload;
    openMenu(store, template, { window, clientX, clientY });
  });
}
