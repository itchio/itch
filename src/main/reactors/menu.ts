import { Watcher } from "common/util/watcher";

import { BrowserWindow } from "common/helpers/browser-window";
import { Menu } from "common/helpers/menu";

import { createSelector } from "reselect";

import { Runtime, MenuItem, MenuTemplate } from "common/types";

import { RootState } from "common/types";
import { fleshOutTemplate } from "main/reactors/context-menu/flesh-out-template";
import { actions } from "common/actions";
import { Profile } from "common/butlerd/messages";

export default function (watcher: Watcher, runtime: Runtime) {
  watcher.onStateChange({
    makeSelector: (store, schedule) => {
      let templateSelector = createSelector(
        (rs: RootState) => rs.system.appVersion,
        (rs: RootState) => rs.profile.profile,
        (rs: RootState) => rs.preferences.enableTabs,
        (appVersion, credentials, enableTabs) => {
          return computeMenuTemplate(
            appVersion,
            credentials,
            enableTabs,
            runtime
          );
        }
      );

      return createSelector(
        templateSelector,
        (rs: RootState) => rs.i18n,
        (rs: RootState) => {
          let res = [];
          for (const k of Object.keys(rs.winds)) {
            res.push(rs.winds[k].native.id);
          }
          // this little trick is here for memoization! dumb, I know :)
          return JSON.stringify(res);
        },
        (template, i18n, nativeIDsPayload) => {
          schedule.dispatch(actions.menuChanged({ template }));
          const fleshed = fleshOutTemplate("root", store, runtime, template);
          const menu = Menu.buildFromTemplate(fleshed);
          setItchAppMenu(nativeIDsPayload, runtime, menu);
        }
      );
    },
  });
}

interface AllTemplates {
  mainMac: MenuItem;
  fileWithTabs: MenuItem;
  fileNoTabs: MenuItem;
  fileMacWithTabs: MenuItem;
  fileMacNoTabs: MenuItem;
  edit: MenuItem;
  view: MenuItem;
  accountLoggedOut: MenuItem;
  account: MenuItem;
  help: MenuItem;
}

function computeMenuTemplate(
  appVersion: string,
  profile: Profile,
  enableTabs: boolean,
  runtime: Runtime
) {
  const hiddenTabShortcuts: MenuItem[] = [
    // next tab
    {
      localizedLabel: ["menu.file.show_next_tab"],
      accelerator: "Ctrl+Tab",
      visible: false,
    },
    {
      localizedLabel: ["menu.file.show_next_tab"],
      accelerator: "Ctrl+PageDown",
      visible: false,
    },
    // previous tab
    {
      localizedLabel: ["menu.file.show_previous_tab"],
      accelerator: "Ctrl+PageUp",
      visible: false,
    },
    {
      localizedLabel: ["menu.file.show_previous_tab"],
      accelerator: "Ctrl+Shift+Tab",
      visible: false,
    },
    {
      localizedLabel: ["menu.file.focus_tab_1"],
      accelerator: "CmdOrCtrl+1",
      visible: false,
    },
    {
      localizedLabel: ["menu.file.focus_tab_2"],
      accelerator: "CmdOrCtrl+2",
      visible: false,
    },
    {
      localizedLabel: ["menu.file.focus_tab_3"],
      accelerator: "CmdOrCtrl+3",
      visible: false,
    },
    {
      localizedLabel: ["menu.file.focus_tab_4"],
      accelerator: "CmdOrCtrl+4",
      visible: false,
    },
    {
      localizedLabel: ["menu.file.focus_tab_5"],
      accelerator: "CmdOrCtrl+5",
      visible: false,
    },
    {
      localizedLabel: ["menu.file.focus_tab_6"],
      accelerator: "CmdOrCtrl+6",
      visible: false,
    },
    {
      localizedLabel: ["menu.file.focus_tab_7"],
      accelerator: "CmdOrCtrl+7",
      visible: false,
    },
    {
      localizedLabel: ["menu.file.focus_tab_8"],
      accelerator: "CmdOrCtrl+8",
      visible: false,
    },
    {
      localizedLabel: ["menu.file.focus_tab_9"],
      accelerator: "CmdOrCtrl+9",
      visible: false,
    },
  ];
  const hiddenGeneralShortcuts: MenuItem[] = [
    // devtools
    {
      localizedLabel: ["menu.file.open_dev_tools"],
      accelerator: "Shift+F12",
      visible: false,
    },
    {
      localizedLabel: ["menu.file.open_dev_tools"],
      accelerator: "CmdOrCtrl+Shift+C",
      visible: false,
    },

    {
      localizedLabel: ["menu.file.focus_search"],
      accelerator: "CmdOrCtrl+Shift+F",
      visible: false,
    },

    {
      localizedLabel: ["menu.file.focus_in_page_search"],
      accelerator: "CmdOrCtrl+F",
      visible: false,
    },

    // reload
    {
      localizedLabel: ["menu.command.reload"],
      accelerator: "F5",
      visible: false,
    },
    {
      localizedLabel: ["menu.command.reload"],
      accelerator: "CmdOrCtrl+R",
      visible: false,
    },

    {
      localizedLabel: ["menu.command.main"],
      accelerator: "CmdOrCtrl+Enter",
      visible: false,
    },
    {
      localizedLabel: ["menu.command.location"],
      accelerator: "CmdOrCtrl+L",
      visible: false,
    },
    {
      localizedLabel: ["menu.command.go_back"],
      accelerator: "Alt+Left",
      visible: false,
    },
    {
      localizedLabel: ["menu.command.go_forward"],
      accelerator: "Alt+Right",
      visible: false,
    },
  ];

  const menus: AllTemplates = {
    mainMac: {
      role: "appMenu",
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
          role: "hideOthers",
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

    fileWithTabs: {
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
          accelerator: "Alt+F4",
        },
        {
          localizedLabel: ["menu.file.quit"],
          accelerator: "CmdOrCtrl+Q",
        },
        ...hiddenGeneralShortcuts,
        ...hiddenTabShortcuts,
      ],
    },

    fileNoTabs: {
      localizedLabel: ["menu.file.file"],
      submenu: [
        {
          localizedLabel: ["menu.file.preferences"],
          accelerator: "CmdOrCtrl+,",
        },
        {
          localizedLabel: ["menu.file.close_window"],
          accelerator: "Alt+F4",
        },
        {
          localizedLabel: ["menu.file.quit"],
          accelerator: "CmdOrCtrl+Q",
        },
        ...hiddenGeneralShortcuts,
      ],
    },

    fileMacWithTabs: {
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
          accelerator: "Cmd+Alt+W",
        },
        ...hiddenGeneralShortcuts,
        ...hiddenTabShortcuts,
      ],
    },

    fileMacNoTabs: {
      localizedLabel: ["menu.file.file"],
      submenu: [
        {
          localizedLabel: ["menu.file.close_window"],
          accelerator: "Cmd+W",
        },
        ...hiddenGeneralShortcuts,
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
          role: "selectAll",
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

  const template: MenuTemplate = [];
  if (runtime.platform === "osx") {
    template.push(menus.mainMac);
    if (enableTabs) {
      template.push(menus.fileMacWithTabs);
    } else {
      template.push(menus.fileMacNoTabs);
    }
  } else {
    if (enableTabs) {
      template.push(menus.fileWithTabs);
    } else {
      template.push(menus.fileNoTabs);
    }
  }
  template.push(menus.edit);
  template.push(menus.view);
  if (profile) {
    template.push(menus.account);
  } else {
    template.push(menus.accountLoggedOut);
  }

  template.push(menus.help);

  return template;
}

function setItchAppMenu(
  nativeIDsPayload: string,
  runtime: Runtime,
  menu: Electron.Menu
) {
  if (runtime.platform === "osx") {
    Menu.setApplicationMenu(menu);
  } else {
    // we can't use setApplicationMenu on windows & linux because
    // it'll set it for all windows (including launched games)
    const nativeIDs = JSON.parse(nativeIDsPayload) as number[];
    for (const id of nativeIDs) {
      const win = BrowserWindow.fromId(id);
      if (win) {
        win.setMenu(menu);
      }
    }
  }
}
