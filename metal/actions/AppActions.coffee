
AppDispatcher = require "../dispatcher/AppDispatcher"
AppConstants = require "../constants/AppConstants"

AppActions = {
  boot: ->
    AppDispatcher.dispatch {
      action_type: AppConstants.BOOT
    }
    
  quit: ->
    AppDispatcher.dispatch {
      action_type: AppConstants.QUIT
    }

  view_game: (game) ->
    AppDispatcher.dispatch {
      action_type: AppConstants.LIBRARY_VIEW_GAME
      game
    }

  close_game: ->
    AppDispatcher.dispatch {
      action_type: AppConstants.LIBRARY_CLOSE_GAME
    }

  focus_panel: (panel) ->
    AppDispatcher.dispatch {
      action_type: AppConstants.LIBRARY_FOCUS_PANEL
      panel
    }

  login_key: (key) ->
    AppDispatcher.dispatch {
      action_type: AppConstants.LOGIN_KEY
      key
    }

  login_with_password: (username, password) ->
    AppDispatcher.dispatch {
      action_type: AppConstants.LOGIN_WITH_PASSWORD
      username
      password
    }

  login_done: (key) ->
    AppDispatcher.dispatch {
      action_type: AppConstants.LOGIN_DONE
      key
    }

  logout: ->
    AppDispatcher.dispatch {
      action_type: AppConstants.LOGOUT
    }
}

module.exports = AppActions

