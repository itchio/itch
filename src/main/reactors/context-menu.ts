import { actions } from "common/actions";
import { t } from "common/format/t";
import {
  MenuItem,
  MenuTemplate,
  OpenContextMenuBase,
  Store,
} from "common/types";
import { Watcher } from "common/util/watcher";
import { Menu, MenuItemConstructorOptions } from "electron";
import {
  gameControls,
  userMenu,
} from "main/reactors/context-menu/build-template";
import { getNativeWindow } from "main/reactors/winds";

function openMenu(
  store: Store,
  template: MenuTemplate,
  base: OpenContextMenuBase
) {
  if (template.length === 0) {
    // don't show empty context menus
    return;
  }
  store.dispatch(actions.popupContextMenu({ template, ...base }));
}

export default function (watcher: Watcher) {
  watcher.on(actions.openGameContextMenu, async (store, action) => {
    const { game } = action.payload;
    const template = gameControls(store, game);

    const { wind, clientX, clientY } = action.payload;
    openMenu(store, template, { wind, clientX, clientY });
  });

  watcher.on(actions.openUserMenu, async (store, action) => {
    const template = userMenu(store);
    const { wind, clientX, clientY } = action.payload;
    openMenu(store, template, { wind, clientX, clientY });
  });

  watcher.on(actions.popupContextMenu, async (store, action) => {
    const rs = store.getState();
    const { wind, template, clientX, clientY } = action.payload;
    const nw = getNativeWindow(rs, wind);

    const menu = Menu.buildFromTemplate(convertTemplate(store, template));
    menu.popup({
      window: nw,
      x: clientX,
      y: clientY,
    });
  });
}

function convertTemplate(
  store: Store,
  template: MenuItem[]
): MenuItemConstructorOptions[] {
  const rs = store.getState();
  const { i18n } = rs;
  const result: MenuItemConstructorOptions[] = [];
  for (const item of template) {
    const opts: MenuItemConstructorOptions = {};
    if (item.localizedLabel) {
      opts.label = t(i18n, item.localizedLabel);
    }
    if (item.action) {
      opts.click = () => {
        store.dispatch(item.action);
      };
    }
    if (item.type) {
      opts.type = item.type;
    }
    if (item.submenu) {
      opts.submenu = convertTemplate(store, item.submenu);
    }
    if (item.accelerator) {
      opts.accelerator = item.accelerator;
    }
    result.push(opts);
  }
  return result;
}
