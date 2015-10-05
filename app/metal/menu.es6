
import Menu from "menu";
import AppStore from "./stores/app_store";
import AppActions from "./actions/app_actions";
import AppDispatcher from "./dispatcher/app_dispatcher";
import defer from "./defer";

function refresh_menu() {
  let mac = (process.platform == "darwin");
  let repo_url = "https://github.com/itchio/itchio-app";
  function open_url (url) {
    require("shell").openExternal(url);
  }

  let menus = {
    file: {
      label: "File",
      submenu: [
        {
          label: "Close Window",
          accelerator: "CmdOrCtrl+W",
          click: () => AppActions.hide_window()
        },
        {
          label: "Quit",
          accelerator: "CmdOrCtrl+Q",
          click: () => AppActions.quit()
        }
      ]
    },

    edit: {
      label: "Edit",
      visible: false,
      submenu: [
        {
          label: "Cut",
          accelerator: "CmdOrCtrl+X",
          role: "cut"
        },
        {
          label: "Copy",
          accelerator: "CmdOrCtrl+C",
          role: "copy"
        },
        {
          label: "Paste",
          accelerator: "CmdOrCtrl+V",
          role: "paste"
        },
        {
          label: "Select all",
          accelerator: "CmdOrCtrl+A",
          role: "selectall"
        }
      ]
    },

    account: {
      label: "Account",
      submenu: [
        {
          label: "Log out",
          click: () => AppActions.logout()
        }
      ]
    },

    help: {
      label: "Help",
      submenu: [
        {
          label: "View itch.io Terms",
          click: () => open_url("https://itch.io/docs/legal/terms")
        },
        {
          label: "View License",
          click: () => open_url(`${repo_url}/blob/master/LICENSE`)
        },
        {
          label: `Version ${require("app").getVersion()}`,
          enabled: false
        },
        {
          label: "Check for Update",
          click: () => console.log("check for update: stub")
        },
        {
          type: "separator"
        },
        {
          label: "Report Issue",
          click: () => open_url(`${repo_url}/issues/new`)
        },
        {
          label: "Search Issue",
          click: () => open_url(`${repo_url}/search?type=Issues`)
        },
        {
          type: "separator"
        },
        {
          label: "Release Notes",
          click: () => open_url(`${repo_url}/releases`)
        }
      ]
    }
  }

  let template = [menus.file, menus.edit];

  if (AppStore.get_current_user()) {
    template.push(menus.account);
  }

  template.push(menus.help);

  // gotcha: buildFromTemplate mutates its argument - calling it
  // twice with the same argument throws 'Invalid menu template'
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

export function install() {
  AppDispatcher.register((action) => {
    switch (action.action_type) {
      // TODO: keep an eye on that, might need to rebuild in other circumstances.
      case 'BOOT':
      case 'LOGIN_DONE':
      case 'LOGOUT':
        defer(() => refresh_menu());
        break;
    }
  });
}

