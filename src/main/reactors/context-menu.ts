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
  { clientX = null, clientY = null }: IOpenContextMenuBase
) {
  if (template.length === 0) {
    // don't show empty context menus
    return;
  }

  store.dispatch(
    actions.popupContextMenu({ template, clientX: clientX, clientY: clientY })
  );
}

export default function(watcher: Watcher) {
  watcher.on(actions.openTabContextMenu, async (store, action) => {
    const { tab } = action.payload;

    let template: IMenuTemplate;
    template = concatTemplates(template, newTabControls(store, tab));

    const sp = Space.fromStore(store, tab);
    if (sp.prefix === "games") {
      const game = sp.game();
      if (game && game.id) {
        template = concatTemplates(template, gameControls(store, game));
      }
    }

    template = concatTemplates(template, closeTabControls(store, tab));
    const { clientX, clientY } = action.payload;
    openMenu(store, template, { clientX, clientY });
  });

  watcher.on(actions.openGameContextMenu, async (store, action) => {
    const { game } = action.payload;
    const template = gameControls(store, game);

    const { clientX, clientY } = action.payload;
    openMenu(store, template, { clientX, clientY });
  });
}
