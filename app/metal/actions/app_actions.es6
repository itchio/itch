
import AppDispatcher from "../dispatcher/app_dispatcher";
import AppConstants from "../constants/app_constants";

export default {
  boot: () => {
    AppDispatcher.dispatch({
      action_type: AppConstants.BOOT
    });
  },

  quit: () => {
    AppDispatcher.dispatch({
      action_type: AppConstants.QUIT
    });
  },

  view_game: (game) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.LIBRARY_VIEW_GAME,
      game
    });
  },

  close_game: () => {
    AppDispatcher.dispatch({
      action_type: AppConstants.LIBRARY_CLOSE_GAME
    });
  },

  focus_panel: (panel) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.LIBRARY_FOCUS_PANEL,
      panel
    });
  },

  focus_window: () => {
    AppDispatcher.dispatch({
      action_type: AppConstants.FOCUS_WINDOW
    });
  },

  hide_window: () => {
    AppDispatcher.dispatch({
      action_type: AppConstants.HIDE_WINDOW
    });
  },

  login_key: (key) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.LOGIN_KEY,
      key
    });
  },

  login_with_password: (username, password) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.LOGIN_WITH_PASSWORD,
      username,
      password
    });
  },

  login_done: (key) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.LOGIN_DONE,
      key
    });
  },

  setup_done: (key) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.SETUP_DONE
    });
  },

  logout: (key) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.LOGOUT
    });
  },

  logout_done: () => {
    AppDispatcher.dispatch({
      action_type: AppConstants.LOGOUT_DONE
    });
  },

  download_queue: (opts) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.DOWNLOAD_QUEUE,
      opts
    });
  },

  set_progress: (alpha) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.SET_PROGRESS,
      alpha
    });
  },

  install_progress: (opts) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.INSTALL_PROGRESS,
      opts
    });
  },

  clear_progress: (alpha) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.CLEAR_PROGRESS,
      alpha
    });
  },

  bounce: () => {
    AppDispatcher.dispatch({
      action_type: AppConstants.BOUNCE
    });
  },

  notify: (message) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.NOTIFY,
      message
    });
  },
};

