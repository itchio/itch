import { Watcher } from "./watcher";

import { Menu } from "electron";

import { map } from "underscore";
import { createSelector } from "reselect";

import * as clone from "clone";
import localizer from "../localizer";

import { IRuntime } from "../types";

import urls from "../constants/urls";
import * as actions from "../actions";

import {
  IStore,
  IAppState,
  ISessionCredentialsState,
  ISystemState,
} from "../types";

type IMenuItem = Electron.MenuItemConstructorOptions;
type IMenuTemplate = IMenuItem[];

let refreshSelector: (state: IAppState) => void;

let applySelector: (state: IAppState) => void;

interface IMenuItemPayload {
  role?: string;
  label?: string;
}

function convertMenuAction(payload: IMenuItemPayload, runtime: IRuntime) {
  const { role, label } = payload;

  switch (role) {
    case "about":
      return actions.openUrl({ url: urls.appHomepage });
    default: // muffin
  }

  switch (label) {
    case "sidebar.new_tab":
      return actions.newTab({});
    case "menu.file.close_tab":
      return runtime.platform === "osx"
        ? actions.closeTabOrAuxWindow({})
        : actions.closeCurrentTab({});
    case "menu.file.close_all_tabs":
      return actions.closeAllTabs({});
    case "menu.file.close_window":
      return actions.hideWindow({});
    case "menu.file.quit":
      return actions.quitWhenMain({});
    case "menu.file.preferences":
      return actions.navigate("preferences");
    case "menu.view.downloads":
      return actions.navigate("downloads");
    case "menu.account.change_user":
      return actions.changeUser({});
    case "menu.help.view_terms":
      return actions.openUrl({ url: urls.termsOfService });
    case "menu.help.view_license":
      return actions.openUrl({ url: `${urls.itchRepo}/blob/master/LICENSE` });
    case "menu.help.check_for_update":
      return actions.checkForSelfUpdate({});
    case "menu.help.report_issue":
      return actions.openUrl({ url: `${urls.itchRepo}/issues/new` });
    case "menu.help.search_issue":
      return actions.openUrl({ url: `${urls.itchRepo}/search?type=Issues` });
    case "menu.help.release_notes":
      return actions.openUrl({ url: `${urls.itchRepo}/releases` });
    default:
      return null;
  }
}

export function fleshOutTemplate(
  template: IMenuTemplate,
  store: IStore,
  runtime: IRuntime,
) {
  const { i18n } = store.getState();
  const t = localizer.getT(i18n.strings, i18n.lang);

  const visitNode = (input: IMenuItem) => {
    if (input.type === "separator") {
      return input;
    }

    const { label, role = null, enabled = true } = input;
    const node = clone(input);

    node.label = t(label);
    if (enabled) {
      node.click = e => {
        const menuAction = convertMenuAction({ label, role }, runtime);
        if (menuAction) {
          store.dispatch(menuAction);
        }
      };
    }

    if (node.submenu) {
      node.submenu = map(node.submenu as IMenuItem[], visitNode);
    }

    return node;
  };

  return map(template, visitNode);
}

export default function(watcher: Watcher, runtime: IRuntime) {
  watcher.onAll(async (store, action) => {
    const currentState = store.getState();

    if (!refreshSelector) {
      refreshSelector = createSelector(
        (state: IAppState) => state.system,
        (state: IAppState) => state.session.credentials,
        (system, credentials) => {
          setImmediate(() => {
            const template = computeMenuTemplate(system, credentials, runtime);
            store.dispatch(actions.menuChanged({ template }));
          });
        },
      );
    }
    refreshSelector(currentState);

    if (!applySelector) {
      applySelector = createSelector(
        (state: IAppState) => state.ui.menu.template,
        (state: IAppState) => state.i18n,
        (template, i18n) => {
          setImmediate(() => {
            // electron gotcha: buildFromTemplate mutates its argument
            const fleshed = fleshOutTemplate(template, store, runtime);
            const menu = Menu.buildFromTemplate(clone(fleshed));
            Menu.setApplicationMenu(menu);
          });
        },
      );
    }
    applySelector(currentState);
  });
}

function computeMenuTemplate(
  system: ISystemState,
  credentials: ISessionCredentialsState,
  runtime: IRuntime,
) {
  const menus = {
    mainMac: {
      // no need for a label, it'll always be app name
      submenu: [
        {
          role: "about",
        },
        {
          type: "separator",
        },
        {
          label: "menu.file.preferences",
          accelerator: "CmdOrCtrl+,",
        },
        {
          type: "separator",
        },
        {
          role: "hide",
        },
        {
          role: "hideothers",
        },
        {
          role: "unhide",
        },
        {
          type: "separator",
        },
        {
          label: "menu.file.quit",
          accelerator: "CmdOrCtrl+Q",
        },
      ],
    } as IMenuItem,

    file: {
      label: "menu.file.file",
      submenu: [
        {
          label: "sidebar.new_tab",
          accelerator: "CmdOrCtrl+T",
        },
        {
          type: "separator",
        },
        {
          label: "menu.file.preferences",
          accelerator: "CmdOrCtrl+,",
        },
        {
          type: "separator",
        },
        {
          label: "menu.file.close_tab",
          accelerator: "CmdOrCtrl+W",
        },
        {
          label: "menu.file.close_all_tabs",
          accelerator: "CmdOrCtrl+Shift+W",
        },
        {
          label: "menu.file.close_window",
          accelerator: system.macos ? "Cmd+Alt+W" : "Alt+F4",
        },
        {
          label: "menu.file.quit",
          accelerator: "CmdOrCtrl+Q",
        },
      ],
    } as IMenuItem,

    fileMac: {
      label: "menu.file.file",
      submenu: [
        {
          label: "sidebar.new_tab",
          accelerator: "CmdOrCtrl+T",
        },
        {
          type: "separator",
        },
        {
          label: "menu.file.close_tab",
          accelerator: "CmdOrCtrl+W",
        },
        {
          label: "menu.file.close_all_tabs",
          accelerator: "CmdOrCtrl+Shift+W",
        },
        {
          label: "menu.file.close_window",
          accelerator: system.macos ? "Cmd+Alt+W" : "Alt+F4",
        },
      ],
    } as IMenuItem,

    edit: {
      label: "menu.edit.edit",
      visible: false,
      submenu: [
        {
          label: "menu.edit.cut",
          accelerator: "CmdOrCtrl+X",
          role: "cut",
        },
        {
          label: "menu.edit.copy",
          accelerator: "CmdOrCtrl+C",
          role: "copy",
        },
        {
          label: "menu.edit.paste",
          accelerator: "CmdOrCtrl+V",
          role: "paste",
        },
        {
          label: "menu.edit.select_all",
          accelerator: "CmdOrCtrl+A",
          role: "selectall",
        },
      ],
    } as IMenuItem,

    view: {
      label: "menu.view.view",
      submenu: [
        {
          label: "menu.view.downloads",
          accelerator: "CmdOrCtrl+J",
        },
      ],
    } as IMenuItem,

    accountLoggedOut: {
      label: "menu.account.account",
      submenu: [
        {
          label: "menu.account.not_logged_in",
          enabled: false,
        },
      ],
    } as IMenuItem,

    account: {
      label: "menu.account.account",
      submenu: [
        {
          label: "menu.account.change_user",
        },
      ],
    } as IMenuItem,

    help: {
      label: "menu.help.help",
      role: "help",
      submenu: [
        {
          label: "menu.help.view_terms",
        },
        {
          label: "menu.help.view_license",
        },
        {
          label: `Version ${system.appVersion}`,
          enabled: false,
        },
        {
          label: "menu.help.check_for_update",
        },
        {
          type: "separator",
        },
        {
          label: "menu.help.report_issue",
        },
        {
          label: "menu.help.search_issue",
        },
        {
          type: "separator",
        },
        {
          label: "menu.help.release_notes",
        },
      ],
    } as IMenuItem,
  };

  const template: IMenuItem[] = [];
  if (runtime.platform === "osx") {
    template.push(menus.mainMac);
    template.push(menus.fileMac);
  } else {
    template.push(menus.file);
  }
  template.push(menus.edit);
  template.push(menus.view);
  if (credentials.key) {
    template.push(menus.account);
  } else {
    template.push(menus.accountLoggedOut);
  }

  template.push(menus.help);

  return template;
}
