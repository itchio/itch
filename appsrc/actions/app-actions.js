
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

  /* Locale updates */

  locale_update_queue_download: (lang) => {
    AppDispatcher.dispatch({ action_type: AppConstants.LOCALE_UPDATE_QUEUE_DOWNLOAD, lang })
  },

  locale_update_downloaded: (lang, resources) => {
    AppDispatcher.dispatch({ action_type: AppConstants.LOCALE_UPDATE_DOWNLOADED, lang, resources })
  },

  locale_update_download_start: (lang, resources) => {
    AppDispatcher.dispatch({ action_type: AppConstants.LOCALE_UPDATE_DOWNLOAD_START, lang })
  },

  locale_update_download_end: (lang, resources) => {
    AppDispatcher.dispatch({ action_type: AppConstants.LOCALE_UPDATE_DOWNLOAD_END, lang, resources })
  },

  /* Install locations */

  compute_install_location_size: (name) => {
    AppDispatcher.dispatch({ action_type: AppConstants.COMPUTE_INSTALL_LOCATION_SIZE, name })
  },

  cancel_install_location_size_computation: (name) => {
    AppDispatcher.dispatch({ action_type: AppConstants.CANCEL_INSTALL_LOCATION_SIZE_COMPUTATION, name })
  },

  browse_install_location: (name) => {
    AppDispatcher.dispatch({ action_type: AppConstants.BROWSE_INSTALL_LOCATION, name })
  },

  add_install_location_request: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.ADD_INSTALL_LOCATION_REQUEST })
  },

  add_install_location: (name, path) => {
    AppDispatcher.dispatch({ action_type: AppConstants.ADD_INSTALL_LOCATION, name, path })
  },

  remove_install_location_request: (name) => {
    AppDispatcher.dispatch({ action_type: AppConstants.REMOVE_INSTALL_LOCATION_REQUEST, name })
  },

  remove_install_location: (name) => {
    AppDispatcher.dispatch({ action_type: AppConstants.REMOVE_INSTALL_LOCATION, name })
  },

  transfer_install_location: (name, new_path) => {
    AppDispatcher.dispatch({ action_type: AppConstants.TRANSFER_INSTALL_LOCATION, name, new_path })
  },

  make_install_location_default: (name) => {
    AppDispatcher.dispatch({ action_type: AppConstants.MAKE_INSTALL_LOCATION_DEFAULT, name })
  },

  /* Caves */

  request_cave_uninstall: (id) => {
    AppDispatcher.dispatch({ action_type: AppConstants.REQUEST_CAVE_UNINSTALL, id })
  },

  queue_cave_uninstall: (id) => {
    AppDispatcher.dispatch({ action_type: AppConstants.QUEUE_CAVE_UNINSTALL, id })
  },

  queue_cave_reinstall: (id) => {
    AppDispatcher.dispatch({ action_type: AppConstants.QUEUE_CAVE_REINSTALL, id })
  },

  update_cave: (id, data) => {
    AppDispatcher.dispatch({ action_type: AppConstants.UPDATE_CAVE, id, data })
  },

  cave_progress: (opts) => {
    AppDispatcher.dispatch({ action_type: AppConstants.CAVE_PROGRESS, opts })
  },

  cancel_cave: (id) => {
    AppDispatcher.dispatch({ action_type: AppConstants.CANCEL_CAVE, id })
  },

  implode_cave: (id) => {
    AppDispatcher.dispatch({ action_type: AppConstants.IMPLODE_CAVE, id })
  },

  explore_cave: (id) => {
    AppDispatcher.dispatch({ action_type: AppConstants.EXPLORE_CAVE, id })
  },

  cave_thrown_into_bit_bucket: (id) => {
    AppDispatcher.dispatch({ action_type: AppConstants.CAVE_THROWN_INTO_BIT_BUCKET, id })
  },

  probe_cave: (id) => {
    AppDispatcher.dispatch({ action_type: AppConstants.PROBE_CAVE, id })
  },

  report_cave: (id) => {
    AppDispatcher.dispatch({ action_type: AppConstants.REPORT_CAVE, id })
  },

  /* Games */

  show_packaging_policy: (format, game_id) => {
    AppDispatcher.dispatch({ action_type: AppConstants.SHOW_PACKAGING_POLICY, format, game_id })
  },

  queue_game: (game_id) => {
    AppDispatcher.dispatch({ action_type: AppConstants.QUEUE_GAME, game_id })
  },

  browse_game: (game_id) => {
    AppDispatcher.dispatch({ action_type: AppConstants.BROWSE_GAME, game_id })
  },

  purchase_game: (game_id) => {
    AppDispatcher.dispatch({ action_type: AppConstants.PURCHASE_GAME, game_id })
  },

  gamed_purchase: (game_id, message) => {
    AppDispatcher.dispatch({ action_type: AppConstants.GAMED_PURCHASE, game_id, message })
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

  attempt_login: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.ATTEMPT_LOGIN })
  },

  login_with_password: (username, password) => {
    AppDispatcher.dispatch({ action_type: AppConstants.LOGIN_WITH_PASSWORD, private: true, username, password })
  },

  login_failure: (errors) => {
    AppDispatcher.dispatch({ action_type: AppConstants.LOGIN_FAILURE, errors })
  },

  authenticated: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.AUTHENTICATED })
  },

  ready_to_roll: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.READY_TO_ROLL })
  },

  locations_ready: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.LOCATIONS_READY })
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

  preferences_set_sniffed_language: (language) => {
    AppDispatcher.dispatch({ action_type: AppConstants.PREFERENCES_SET_SNIFFED_LANGUAGE, language })
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

  cave_store_diff: (diff) => {
    AppDispatcher.dispatch({ action_type: AppConstants.CAVE_STORE_DIFF, diff })
  },

  cave_store_cave_diff: (cave_id, diff) => {
    AppDispatcher.dispatch({ action_type: AppConstants.CAVE_STORE_CAVE_DIFF, cave_id, diff })
  },

  install_location_store_diff: (diff) => {
    AppDispatcher.dispatch({ action_type: AppConstants.INSTALL_LOCATION_STORE_DIFF, diff })
  },

  implode_app: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.IMPLODE_APP })
  }
}

module.exports = self
