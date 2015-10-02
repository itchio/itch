(function() {
  var AppActions, Menu, app, make_tray;

  app = require("app");

  Menu = require("menu");

  AppActions = require("./actions/AppActions");

  make_tray = function() {
    var Tray, tray, tray_menu, tray_menu_template;
    tray_menu_template = [
      {
        label: "Owned",
        click: function() {
          return AppActions.focus_panel("owned");
        }
      }, {
        label: "Dashboard",
        click: function() {
          return AppActions.focus_panel("dashboard");
        }
      }
    ];
    if (process.platform !== "darwin") {
      tray_menu_template = tray_menu_template.concat([
        {
          type: "separator"
        }, {
          label: "Exit",
          click: function() {
            return AppActions.quit();
          }
        }
      ]);
    }
    tray_menu = Menu.buildFromTemplate(tray_menu_template);
    if (process.platform === "darwin") {
      return app.dock.setMenu(tray_menu);
    } else {
      Tray = require("tray");
      tray = new Tray("./static/images/itchio-tray-small.png");
      tray.setToolTip("itch.io");
      tray.setContextMenu(tray_menu);
      tray.on("clicked", function() {
        return AppActions.focus_window();
      });
      tray.on("double-clicked", function() {
        return AppActions.focus_window();
      });
      return app.main_tray = tray;
    }
  };

  module.exports = {
    make_tray: make_tray
  };

}).call(this);

//# sourceMappingURL=../app/maps/metal/tray.js.map
