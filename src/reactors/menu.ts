import { Watcher } from "./watcher";

import { Menu, BrowserWindow } from "electron";

import { createSelector } from "reselect";

import { IRuntime, IMenuItem, IMenuTemplate } from "../types";

import * as actions from "../actions";

import { IAppState, ISessionCredentialsState } from "../types";
import { fleshOutTemplate } from "./context-menu/flesh-out-template";

let refreshSelector: (state: IAppState) => void;

let applySelector: (state: IAppState) => void;

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
            runtime
          );
          setImmediate(() => {
            try {
              store.dispatch(actions.menuChanged({ template }));
            } catch (e) {
              console.error(`Couldn't dispatch new menu: ${e}`);
            }
          });
        }
      );
    }
    refreshSelector(currentState);

    if (!applySelector) {
      applySelector = createSelector(
        (state: IAppState) => state.ui.menu.template,
        (state: IAppState) => state.i18n,
        (template, i18n) => {
          setImmediate(() => {
            const fleshed = fleshOutTemplate(store, runtime, template);
            const menu = Menu.buildFromTemplate(fleshed);
            const rs = store.getState();
            const mainWindowId = rs.ui.mainWindow.id;

            if (rs.system.macos) {
              Menu.setApplicationMenu(menu);
            } else {
              if (mainWindowId) {
                // we can't use setApplicationMenu on windows & linux because
                // it'll set it for all windows (including launched games)
                const win = BrowserWindow.fromId(mainWindowId);
                if (win) {
                  win.setMenu(menu);
                }
              }
            }
          });
        }
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
  runtime: IRuntime
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
