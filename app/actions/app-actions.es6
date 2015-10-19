
import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'

let self = {
  boot: () => {
    return AppDispatcher.dispatch({
      action_type: AppConstants.BOOT
    })
  },

  quit: () => {
    return AppDispatcher.dispatch({
      action_type: AppConstants.QUIT
    })
  },

  focus_panel: (panel) => {
    return AppDispatcher.dispatch({
      action_type: AppConstants.LIBRARY_FOCUS_PANEL,
      panel
    })
  },

  focus_window: () => {
    return AppDispatcher.dispatch({
      action_type: AppConstants.FOCUS_WINDOW
    })
  },

  hide_window: () => {
    return AppDispatcher.dispatch({
      action_type: AppConstants.HIDE_WINDOW
    })
  },

  setup_status: (message, icon) => {
    return AppDispatcher.dispatch({
      action_type: AppConstants.SETUP_STATUS,
      message, icon
    })
  },

  no_stored_credentials: () => {
    return AppDispatcher.dispatch({
      action_type: AppConstants.NO_STORED_CREDENTIALS
    })
  },

  login_with_password: (username, password) => {
    return AppDispatcher.dispatch({
      action_type: AppConstants.LOGIN_WITH_PASSWORD,
      private: true,
      username, password
    })
  },

  login_failure: (errors) => {
    return AppDispatcher.dispatch({
      action_type: AppConstants.LOGIN_FAILURE,
      errors
    })
  },

  authenticated: () => {
    return AppDispatcher.dispatch({
      action_type: AppConstants.AUTHENTICATED
    })
  },

  logout: (key) => {
    return AppDispatcher.dispatch({
      action_type: AppConstants.LOGOUT
    })
  },

  install_queue: (game_id) => {
    return AppDispatcher.dispatch({
      action_type: AppConstants.INSTALL_QUEUE,
      game_id
    })
  },

  install_update: (id, data) => {
    return AppDispatcher.dispatch({
      action_type: AppConstants.INSTALL_UPDATE,
      id,
      data
    })
  },

  install_progress: (opts) => {
    return AppDispatcher.dispatch({
      action_type: AppConstants.INSTALL_PROGRESS,
      opts
    })
  },

  set_progress: (alpha) => {
    return AppDispatcher.dispatch({
      action_type: AppConstants.SET_PROGRESS,
      alpha
    })
  },

  bounce: () => {
    return AppDispatcher.dispatch({
      action_type: AppConstants.BOUNCE
    })
  },

  notify: (message) => {
    return AppDispatcher.dispatch({
      action_type: AppConstants.NOTIFY,
      message
    })
  },

  fetch_games: (path) => {
    return AppDispatcher.dispatch({
      action_type: AppConstants.FETCH_GAMES,
      path
    })
  },

  eval: (code) => {
    return AppDispatcher.dispatch({
      action_type: AppConstants.EVAL,
      code
    })
  }
}

export default self
