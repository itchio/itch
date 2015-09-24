(function() {
  var AppActions, AppConstants, AppDispatcher;

  AppDispatcher = require("../dispatcher/AppDispatcher");

  AppConstants = require("../constants/AppConstants");

  AppActions = {
    view_game: function(game) {
      return AppDispatcher.dispatch({
        actionType: AppConstants.VIEW_GAME,
        game: game
      });
    },
    close_game: function() {
      return AppDispatcher.dispatch({
        actionType: AppConstants.CLOSE_GAME
      });
    },
    focus_panel: function(panel) {
      return AppDispatcher.dispatch({
        actionType: AppConstants.FOCUS_PANEL,
        panel: panel
      });
    }
  };

  module.exports = AppActions;

}).call(this);
