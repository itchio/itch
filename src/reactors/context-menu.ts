import { Watcher } from "./watcher";

import { BrowserWindow, Menu } from "electron";

import { IStore, IMenuTemplate, currentRuntime } from "../types";

import * as actions from "../actions";

import { DB } from "../db";

import { Space } from "../helpers/space";
import { IOpenContextMenuBase } from "../constants/action-types";
import { fleshOutTemplate } from "./context-menu/flesh-out-template";
import {
  gameControls,
  newTabControls,
  concatTemplates,
  closeTabControls,
} from "./context-menu/build-template";
import Context from "../context/index";

function openMenu(
  store: IStore,
  template: IMenuTemplate,
  { pageX = null, pageY = null }: IOpenContextMenuBase
) {
  if (template.length === 0) {
    // don't show empty context menus
    return;
  }

  const menu = Menu.buildFromTemplate(
    fleshOutTemplate(store, currentRuntime(), template)
  );
  const mainWindowId = store.getState().ui.mainWindow.id;
  const mainWindow = BrowserWindow.fromId(mainWindowId);
  menu.popup(mainWindow, { async: true, x: pageX, y: pageY });
}

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.openTabContextMenu, async (store, action) => {
    const { tab } = action.payload;
    const ctx = new Context(store, db);

    let template: IMenuTemplate;
    template = concatTemplates(template, newTabControls(ctx, tab));

    const sp = Space.fromStore(store, tab);
    if (sp.prefix === "games") {
      const game = sp.game();
      if (game) {
        template = concatTemplates(template, gameControls(ctx, game));
      }
    }

    template = concatTemplates(template, closeTabControls(ctx, tab));
    const { pageX, pageY } = action.payload;
    openMenu(store, template, { pageX, pageY });
  });

  watcher.on(actions.openGameContextMenu, async (store, action) => {
    const { game } = action.payload;
    const ctx = new Context(store, db);
    const template = gameControls(ctx, game);

    const { pageX, pageY } = action.payload;
    openMenu(store, template, { pageX, pageY });
  });
}
