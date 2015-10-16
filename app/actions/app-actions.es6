
import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'

export default {
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

  hide_window: () => {
    AppDispatcher.dispatch({
      action_type: AppConstants.HIDE_WINDOW
    })
  },

  login_with_password: (username, password) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.LOGIN_WITH_PASSWORD,
      username,
      password
    })
  },

  login_done: (key) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.LOGIN_DONE,
      key
    })
  },

  logout: (key) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.LOGOUT
    })
  },

  logout_done: () => {
    AppDispatcher.dispatch({
      action_type: AppConstants.LOGOUT_DONE
    })
  },

  download_queue: (opts) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.DOWNLOAD_QUEUE,
      opts
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

  clear_progress: () => {
    AppDispatcher.dispatch({
      action_type: AppConstants.CLEAR_PROGRESS
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
  }
}
