
import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'

let self = {
  boot: () => {
    AppDispatcher.dispatch({
      action_type: AppConstants.BOOT
    })
  },

  quit: () => {
    AppDispatcher.dispatch({
      action_type: AppConstants.QUIT
    })
  },

  focus_panel: (panel) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.LIBRARY_FOCUS_PANEL,
      panel
    })
  },

  focus_window: () => {
    AppDispatcher.dispatch({
      action_type: AppConstants.FOCUS_WINDOW
    })
  },

  window_ready: () => {
    AppDispatcher.dispatch({
      action_type: AppConstants.WINDOW_READY
    })
  },

  hide_window: () => {
    AppDispatcher.dispatch({
      action_type: AppConstants.HIDE_WINDOW
    })
  },

  setup_status: (message, icon) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.SETUP_STATUS,
      message, icon
    })
  },

  setup_done: () => {
    AppDispatcher.dispatch({
      action_type: AppConstants.SETUP_DONE
    })
  },

  no_stored_credentials: () => {
    AppDispatcher.dispatch({
      action_type: AppConstants.NO_STORED_CREDENTIALS
    })
  },

  login_with_password: (username, password) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.LOGIN_WITH_PASSWORD,
      private: true,
      username, password
    })
  },

  login_failure: (errors) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.LOGIN_FAILURE,
      errors
    })
  },

  authenticated: () => {
    AppDispatcher.dispatch({
      action_type: AppConstants.AUTHENTICATED
    })
  },

  logout: (key) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.LOGOUT
    })
  },

  install_queue: (game_id) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.INSTALL_QUEUE,
      game_id
    })
  },

  install_update: (id, data) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.INSTALL_UPDATE,
      id,
      data
    })
  },

  install_progress: (opts) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.INSTALL_PROGRESS,
      opts
    })
  },

  set_progress: (alpha) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.SET_PROGRESS,
      alpha
    })
  },

  bounce: () => {
    AppDispatcher.dispatch({
      action_type: AppConstants.BOUNCE
    })
  },

  notify: (message) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.NOTIFY,
      message
    })
  },

  fetch_games: (path) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.FETCH_GAMES,
      path
    })
  },

  eval: (code) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.EVAL,
      code
    })
  }
}

export default self
