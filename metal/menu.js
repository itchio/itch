(function() {
  var AppActions, AppDispatcher, AppStore, Menu, install, refresh_menu;

  Menu = require("menu");

  AppStore = require("./stores/AppStore");

  AppActions = require("./actions/AppActions");

  AppDispatcher = require("./dispatcher/AppDispatcher");

  refresh_menu = function() {
    var mac, menus, template;
    mac = process.platform === "darwin";
    menus = {
      file: {
        label: "File",
        submenu: [
          {
            label: "Close Window",
            accelerator: mac ? "Command+W" : "Alt+F4",
            click: function() {
              var ref;
              return (ref = require("app").main_window) != null ? ref.hide() : void 0;
            }
          }, {
            label: "Quit",
            accelerator: mac ? "Command+Q" : "Ctrl+Q",
            click: function() {
              return AppActions.quit();
            }
          }
        ]
      },
      account: {
        label: "Account",
        submenu: [
          {
            label: "Log out",
            click: function() {
              return AppActions.logout();
            }
          }
        ]
      }
    };
    template = [menus.file];
    if (AppStore.get_current_user()) {
      template.push(menus.account);
    }
    return Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  };

  install = function() {
    return AppDispatcher.register(function(action) {
      switch (action.action_type) {
        case 'BOOT':
        case 'LOGIN_DONE':
        case 'LOGOUT':
          return setTimeout((function() {
            return refresh_menu();
          }), 0);
      }
    });
  };

  module.exports = {
    install: install
  };

}).call(this);

//# sourceMappingURL=../app/maps/metal/menu.js.map
