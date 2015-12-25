
let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')

let self = {
  boot: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.BOOT })
  },

  open_url: (url) => {
    AppDispatcher.dispatch({ action_type: AppConstants.OPEN_URL, url })
  },

  window_ready: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.WINDOW_READY })
  },

  setup_status: (message, icon, variables) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.SETUP_STATUS,
      message, icon, variables
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

  apply_self_update_for_realsies: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.APPLY_SELF_UPDATE_FOR_REALSIES })
  },

  dismiss_status: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.DISMISS_STATUS })
  },

  /* Install locations */

  install_location_compute_size: (name) => {
    AppDispatcher.dispatch({ action_type: AppConstants.INSTALL_LOCATION_COMPUTE_SIZE, name })
  },

  install_location_browse: (name) => {
    AppDispatcher.dispatch({ action_type: AppConstants.INSTALL_LOCATION_BROWSE, name })
  },

  install_location_add_request: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.INSTALL_LOCATION_ADD_REQUEST })
  },

  install_location_add: (name, path) => {
    AppDispatcher.dispatch({ action_type: AppConstants.INSTALL_LOCATION_ADD, name, path })
  },

  install_location_added: (name) => {
    AppDispatcher.dispatch({ action_type: AppConstants.INSTALL_LOCATION_ADDED, name })
  },

  install_location_remove_request: (name) => {
    AppDispatcher.dispatch({ action_type: AppConstants.INSTALL_LOCATION_REMOVE_REQUEST, name })
  },

  install_location_remove: (name) => {
    AppDispatcher.dispatch({ action_type: AppConstants.INSTALL_LOCATION_REMOVE, name })
  },

  install_location_removed: (name) => {
    AppDispatcher.dispatch({ action_type: AppConstants.INSTALL_LOCATION_REMOVED, name })
  },

  install_location_transfer: (name, new_path) => {
    AppDispatcher.dispatch({ action_type: AppConstants.INSTALL_LOCATION_TRANSFER, name, new_path })
  },

  install_location_make_default: (name) => {
    AppDispatcher.dispatch({ action_type: AppConstants.INSTALL_LOCATION_MAKE_DEFAULT, name })
  },

  /* Caves */

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

  cave_explore: (id) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.CAVE_EXPLORE,
      id
    })
  },

  cave_thrown_into_bit_bucket: (id) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.CAVE_THROWN_INTO_BIT_BUCKET,
      id
    })
  },

  cave_probe: (id) => {
    AppDispatcher.dispatch({ action_type: AppConstants.CAVE_PROBE, id })
  },

  cave_report: (id) => {
    AppDispatcher.dispatch({ action_type: AppConstants.CAVE_REPORT, id })
  },

  game_browse: (id) => {
    AppDispatcher.dispatch({ action_type: AppConstants.GAME_BROWSE, id })
  },

  game_purchase: (id) => {
    AppDispatcher.dispatch({ action_type: AppConstants.GAME_PURCHASE, id })
  },

  game_purchased: (id, message) => {
    AppDispatcher.dispatch({ action_type: AppConstants.GAME_PURCHASED, id, message })
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

  fetch_collections: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.FETCH_COLLECTIONS })
  },

  fetch_games: (path) => {
    AppDispatcher.dispatch({ action_type: AppConstants.FETCH_GAMES, path })
  },

  games_fetched: (game_ids) => {
    AppDispatcher.dispatch({ action_type: AppConstants.GAMES_FETCHED, game_ids })
  },

  eval: (code) => {
    AppDispatcher.dispatch({
      action_type: AppConstants.EVAL,
      code
    })
  },

  open_preferences: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.OPEN_PREFERENCES })
  },

  preferences_set_language: (language) => {
    AppDispatcher.dispatch({ action_type: AppConstants.PREFERENCES_SET_LANGUAGE, language })
  },

  quit: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.QUIT })
  },

  gain_focus: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.GAIN_FOCUS })
  },

  game_store_diff: (diff) => {
    AppDispatcher.dispatch({ action_type: AppConstants.GAME_STORE_DIFF, diff })
  },

  app_implode: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.APP_IMPLODE })
  }
}

module.exports = self
