
import * as actions from "../../actions";
import reducer from "../reducer";

import {IUIMenuState} from "../../types";
import {
  IRefreshMenuPayload,
} from "../../constants/action-types";

const initialState = {
  template: [],
} as IUIMenuState;

export default reducer<IUIMenuState>(initialState, (on) => {
  on(actions.refreshMenu, (state, action) => {
    return {
      template: computeMenuTemplate(action.payload),
    };
  });
});

function computeMenuTemplate (payload: IRefreshMenuPayload) {
  const {system, credentials} = payload;
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
    },

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
          accelerator: (system.macos ? "Cmd+Alt+W" : "Alt+F4"),
        },
        {
          label: "menu.file.quit",
          accelerator: "CmdOrCtrl+Q",
        },
      ],
    },

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
          accelerator: (system.macos ? "Cmd+Alt+W" : "Alt+F4"),
        },
      ],
    },

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
    },

    view: {
      label: "menu.view.view",
      submenu: [
        {
          label: "menu.view.history",
          accelerator: system.macos ? "Cmd+Y" : "Ctrl+H",
        },
        {
          label: "menu.view.downloads",
          accelerator: "CmdOrCtrl+J",
        },
      ],
    },

    accountLoggedOut: {
      label: "menu.account.account",
      submenu: [
        {
          label: "menu.account.not_logged_in",
          enabled: false,
        },
      ],
    },

    account: {
      label: "menu.account.account",
      submenu: [
        {
          label: "menu.account.change_user",
        },
      ],
    },

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
    },
  };

  if (process.env.SHOW_ME_CRASHY === "1") {
    menus.help.submenu.push({label: "crash.test"});
  }

  const template = [] as any;
  if (system.macos) {
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
