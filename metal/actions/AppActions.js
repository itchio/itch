(function() {
  var AppActions, AppConstants, AppDispatcher;

  AppDispatcher = require("../dispatcher/AppDispatcher");

  AppConstants = require("../constants/AppConstants");

  AppActions = {
    boot: function() {
      return AppDispatcher.dispatch({
        action_type: AppConstants.BOOT
      });
    },
    quit: function() {
      return AppDispatcher.dispatch({
        action_type: AppConstants.QUIT
      });
    },
    view_game: function(game) {
      return AppDispatcher.dispatch({
        action_type: AppConstants.LIBRARY_VIEW_GAME,
        game: game
      });
    },
    close_game: function() {
      return AppDispatcher.dispatch({
        action_type: AppConstants.LIBRARY_CLOSE_GAME
      });
    },
    focus_panel: function(panel) {
      return AppDispatcher.dispatch({
        action_type: AppConstants.LIBRARY_FOCUS_PANEL,
        panel: panel
      });
    },
    focus_window: function() {
      return AppDispatcher.dispatch({
        action_type: AppConstants.FOCUS_WINDOW
      });
    },
    login_key: function(key) {
      return AppDispatcher.dispatch({
        action_type: AppConstants.LOGIN_KEY,
        key: key
      });
    },
    login_with_password: function(username, password) {
      return AppDispatcher.dispatch({
        action_type: AppConstants.LOGIN_WITH_PASSWORD,
        username: username,
        password: password
      });
    },
    login_done: function(key) {
      return AppDispatcher.dispatch({
        action_type: AppConstants.LOGIN_DONE,
        key: key
      });
    },
    logout: function() {
      return AppDispatcher.dispatch({
        action_type: AppConstants.LOGOUT
      });
    }
  };

  module.exports = AppActions;

}).call(this);
