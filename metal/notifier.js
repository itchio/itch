(function() {
  var AppConstants, AppDispatcher, app, install;

  app = require("app");

  AppConstants = require("./constants/AppConstants");

  AppDispatcher = require("./dispatcher/AppDispatcher");

  install = function() {
    return AppDispatcher.register(function(action) {
      var alpha, code, message, percent, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7;
      switch (action.action_type) {
        case AppConstants.SET_PROGRESS:
          alpha = action.alpha;
          percent = alpha * 100;
          if ((ref = app.main_window) != null) {
            ref.setProgressBar(alpha);
          }
          return (ref1 = app.dock) != null ? ref1.setBadge((percent.toFixed()) + "%") : void 0;
        case AppConstants.CLEAR_PROGRESS:
          if ((ref2 = app.main_window) != null) {
            ref2.setProgressBar(-1);
          }
          return (ref3 = app.dock) != null ? ref3.setBadge("") : void 0;
        case AppConstants.BOUNCE:
          return (ref4 = app.dock) != null ? ref4.bounce() : void 0;
        case AppConstants.NOTIFY:
          message = action.message;
          switch (process.platform) {
            case "win32":
              return (ref5 = app.main_tray) != null ? ref5.displayBalloon({
                title: "itch.io",
                content: message
              }) : void 0;
            default:
              code = "new Notification(" + (JSON.stringify(message)) + ")";
              return (ref6 = app.main_window) != null ? (ref7 = ref6.webContents) != null ? ref7.executeJavaScript(code) : void 0 : void 0;
          }
      }
    });
  };

  module.exports = {
    install: install
  };

}).call(this);

//# sourceMappingURL=../app/maps/metal/notifier.js.map
