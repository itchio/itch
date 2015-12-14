'use strict'

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')

let self = {
  boot: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.BOOT })
  },

  window_ready: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.WINDOW_READY })
  },

  setup_status: (message, icon) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.SETUP_STATUS,
      message, icon
    })
  },

  setup_wait: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.SETUP_WAIT })
  },

  setup_done: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.SETUP_DONE })
  },

  focus_window: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.FOCUS_WINDOW })
  },

  hide_window: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.HIDE_WINDOW })
  },

  focus_panel: (panel) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.LIBRARY_FOCUS_PANEL,
      panel
    })
  },

  check_for_self_update: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.CHECK_FOR_SELF_UPDATE })
  },

  checking_for_self_update: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.CHECKING_FOR_SELF_UPDATE })
  },

  self_update_available: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.SELF_UPDATE_AVAILABLE })
  },

  self_update_not_available: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.SELF_UPDATE_NOT_AVAILABLE })
  },

  self_update_error: (message) => {
    AppDispatcher.dispatch({ action_type: AppConstants.SELF_UPDATE_ERROR, message })
  },

  self_update_downloaded: (version) => {
    AppDispatcher.dispatch({ action_type: AppConstants.SELF_UPDATE_DOWNLOADED, version })
  },

  apply_self_update: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.APPLY_SELF_UPDATE })
  },

  dismiss_update_error: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.DISMISS_UPDATE_ERROR })
  },

  cave_queue: (game_id) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.CAVE_QUEUE,
      game_id
    })
  },

  cave_queue_uninstall: (id) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.CAVE_QUEUE_UNINSTALL,
      id
    })
  },

  cave_update: (id, data) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.CAVE_UPDATE,
      id,
      data
    })
  },

  cave_progress: (opts) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.CAVE_PROGRESS,
      opts
    })
  },

  cave_implode: (id) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.CAVE_IMPLODE,
      id
    })
  },

  cave_thrown_into_bit_bucket: (id) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.CAVE_THROWN_INTO_BIT_BUCKET,
      id
    })
  },

  set_progress: (alpha) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.SET_PROGRESS,
      alpha
    })
  },

  bounce: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.BOUNCE })
  },

  notify: (message) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.NOTIFY,
      message
    })
  },

  no_stored_credentials: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.NO_STORED_CREDENTIALS })
  },

  login_attempt: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.LOGIN_ATTEMPT })
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
    AppDispatcher.dispatch({ action_type: AppConstants.AUTHENTICATED })
  },

  ready_to_roll: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.READY_TO_ROLL })
  },

  change_user: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.CHANGE_USER })
  },

  logout: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.LOGOUT })
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
  },

  quit: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.QUIT })
  }
}

module.exports = self
