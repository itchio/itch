
AppDispatcher = require "../dispatcher/AppDispatcher"
AppConstants = require "../constants/AppConstants"

AppActions = {
  view_game: (game) ->
    AppDispatcher.dispatch {
      actionType: AppConstants.VIEW_GAME
      game
    }

  close_game: ->
    AppDispatcher.dispatch {
      actionType: AppConstants.CLOSE_GAME
    }

  focus_panel: (panel) ->
    AppDispatcher.dispatch {
      actionType: AppConstants.FOCUS_PANEL
      panel
    }
}

module.exports = AppActions

