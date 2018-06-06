import { Watcher } from "common/util/watcher";

import { BrowserWindow } from "common/helpers/browser-window";
import { Menu } from "common/helpers/menu";

import { createSelector } from "reselect";

import { IRuntime, IMenuItem, IMenuTemplate } from "common/types";

import { IRootState, IProfileCredentialsState } from "common/types";
import { fleshOutTemplate } from "./context-menu/flesh-out-template";
import { actions } from "common/actions";

export default function(watcher: Watcher, runtime: IRuntime) {
  watcher.onStateChange({
    makeSelector: (store, schedule) => {
      let templateSelector = createSelector(
        (rs: IRootState) => rs.system.appVersion,
        (rs: IRootState) => rs.profile.credentials,
        (appVersion, credentials) => {
          return computeMenuTemplate(appVersion, credentials, runtime);
        }
      );

      return createSelector(
        templateSelector,
        (rs: IRootState) => rs.i18n,
        (rs: IRootState) => rs.ui.mainWindow.id,
        (template, i18n, mainWindowId) => {
          schedule.dispatch(actions.menuChanged({ template }));
          const fleshed = fleshOutTemplate("root", store, runtime, template);
          const menu = Menu.buildFromTemplate(fleshed);
          setItchAppMenu(mainWindowId, runtime, menu);
        }
      );
    },
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
  credentials: IProfileCredentialsState,
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
          role: "services",
          submenu: [],
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
  if (credentials.me) {
    template.push(menus.account);
  } else {
    template.push(menus.accountLoggedOut);
  }

  template.push(menus.help);

  return template;
}

function setItchAppMenu(
  mainWindowId: number,
  runtime: IRuntime,
  menu: Electron.Menu
) {
  if (runtime.platform === "osx") {
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
}
