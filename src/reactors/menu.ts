import { Watcher } from "./watcher";

import { Menu } from "electron";

import { map } from "underscore";
import { createSelector } from "reselect";

import * as clone from "clone";
import { t } from "../format";

import { IRuntime, ILocalizedString, IMenuItem, IMenuTemplate } from "../types";

import urls from "../constants/urls";
import * as actions from "../actions";

import { IStore, IAppState, ISessionCredentialsState } from "../types";

let refreshSelector: (state: IAppState) => void;

let applySelector: (state: IAppState) => void;

interface IMenuItemPayload {
  role?: string;
  localizedLabel?: ILocalizedString;
}

function convertMenuAction(payload: IMenuItemPayload, runtime: IRuntime) {
  const { role, localizedLabel } = payload;

  switch (role) {
    case "about":
      return actions.openUrl({ url: urls.appHomepage });
    default: // muffin
  }

  const labelString = localizedLabel ? localizedLabel[0] : null;

  switch (labelString) {
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
      return actions.navigate({ tab: "preferences" });
    case "menu.view.downloads":
      return actions.navigate({ tab: "downloads" });
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

  const visitNode = (input: IMenuItem) => {
    if (input.type === "separator") {
      return input;
    }

    const { localizedLabel, role = null, enabled = true } = input;
    const node = clone(input) as Electron.MenuItemConstructorOptions;

    if (localizedLabel) {
      node.label = t(i18n, localizedLabel);
    }
    if (enabled) {
      node.click = e => {
        const menuAction = convertMenuAction({ localizedLabel, role }, runtime);
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
          const template = computeMenuTemplate(
            system.appVersion,
            credentials,
            runtime,
          );
          setImmediate(() => {
            try {
              store.dispatch(actions.menuChanged({ template }));
            } catch (e) {
              console.error(`Couldn't dispatch new menu: ${e}`);
            }
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

interface IAllTemplates {
  mainMac: IMenuItem;
  file: IMenuItem;
  fileMac: IMenuItem;
  edit: IMenuItem;
  view: IMenuItem;
  accountLoggedOut: IMenuItem;
  account: IMenuItem;
  help: IMenuItem;
}

function computeMenuTemplate(
  appVersion: string,
  credentials: ISessionCredentialsState,
  runtime: IRuntime,
) {
  const menus: IAllTemplates = {
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
          localizedLabel: ["menu.file.preferences"],
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
          localizedLabel: ["menu.file.quit"],
          accelerator: "CmdOrCtrl+Q",
        },
      ],
    },

    file: {
      localizedLabel: ["menu.file.file"],
      submenu: [
        {
          localizedLabel: ["sidebar.new_tab"],
          accelerator: "CmdOrCtrl+T",
        },
        {
          type: "separator",
        },
        {
          localizedLabel: ["menu.file.preferences"],
          accelerator: "CmdOrCtrl+,",
        },
        {
          type: "separator",
        },
        {
          localizedLabel: ["menu.file.close_tab"],
          accelerator: "CmdOrCtrl+W",
        },
        {
          localizedLabel: ["menu.file.close_all_tabs"],
          accelerator: "CmdOrCtrl+Shift+W",
        },
        {
          localizedLabel: ["menu.file.close_window"],
          accelerator: runtime.platform === "osx" ? "Cmd+Alt+W" : "Alt+F4",
        },
        {
          localizedLabel: ["menu.file.quit"],
          accelerator: "CmdOrCtrl+Q",
        },
      ],
    },

    fileMac: {
      localizedLabel: ["menu.file.file"],
      submenu: [
        {
          localizedLabel: ["sidebar.new_tab"],
          accelerator: "CmdOrCtrl+T",
        },
        {
          type: "separator",
        },
        {
          localizedLabel: ["menu.file.close_tab"],
          accelerator: "CmdOrCtrl+W",
        },
        {
          localizedLabel: ["menu.file.close_all_tabs"],
          accelerator: "CmdOrCtrl+Shift+W",
        },
        {
          localizedLabel: ["menu.file.close_window"],
          accelerator: runtime.platform === "osx" ? "Cmd+Alt+W" : "Alt+F4",
        },
      ],
    },

    edit: {
      localizedLabel: ["menu.edit.edit"],
      visible: false,
      submenu: [
        {
          localizedLabel: ["menu.edit.cut"],
          accelerator: "CmdOrCtrl+X",
          role: "cut",
        },
        {
          localizedLabel: ["menu.edit.copy"],
          accelerator: "CmdOrCtrl+C",
          role: "copy",
        },
        {
          localizedLabel: ["menu.edit.paste"],
          accelerator: "CmdOrCtrl+V",
          role: "paste",
        },
        {
          localizedLabel: ["menu.edit.select_all"],
          accelerator: "CmdOrCtrl+A",
          role: "selectall",
        },
      ],
    },

    view: {
      localizedLabel: ["menu.view.view"],
      submenu: [
        {
          localizedLabel: ["menu.view.downloads"],
          accelerator: "CmdOrCtrl+J",
        },
      ],
    },

    accountLoggedOut: {
      localizedLabel: ["menu.account.account"],
      submenu: [
        {
          localizedLabel: ["menu.account.not_logged_in"],
          enabled: false,
        },
      ],
    },

    account: {
      localizedLabel: ["menu.account.account"],
      submenu: [
        {
          localizedLabel: ["menu.account.change_user"],
        },
      ],
    },

    help: {
      localizedLabel: ["menu.help.help"],
      role: "help",
      submenu: [
        {
          localizedLabel: ["menu.help.view_terms"],
        },
        {
          localizedLabel: ["menu.help.view_license"],
        },
        {
          label: `Version ${appVersion}`,
          enabled: false,
        },
        {
          localizedLabel: ["menu.help.check_for_update"],
        },
        {
          type: "separator",
        },
        {
          localizedLabel: ["menu.help.report_issue"],
        },
        {
          localizedLabel: ["menu.help.search_issue"],
        },
        {
          type: "separator",
        },
        {
          localizedLabel: ["menu.help.release_notes"],
        },
      ],
    },
  };

  const template: IMenuTemplate = [];
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
