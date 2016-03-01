
import AppDispatcher from '../dispatcher/app-dispacher'
import AppConstants from '../constants/app-constants'

const self = {
  boot: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.BOOT })
  },

  open_url: (url) => {
    pre: { // eslint-disable-line
      typeof url === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.OPEN_URL, url })
  },

  window_ready: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.WINDOW_READY })
  },

  setup_status: (message, icon, variables) => {
    pre: { // eslint-disable-line
      typeof message === 'string'
      typeof icon === 'string'
    }
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
    pre: { // eslint-disable-line
      typeof panel === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.LIBRARY_FOCUS_PANEL, panel })
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
    pre: { // eslint-disable-line
      typeof message === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.SELF_UPDATE_ERROR, message })
  },

  self_update_downloaded: (version) => {
    pre: { // eslint-disable-line
      typeof version === 'string'
    }
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
    pre: { // eslint-disable-line
      typeof lang === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.LOCALE_UPDATE_QUEUE_DOWNLOAD, lang })
  },

  locale_update_downloaded: (lang, resources) => {
    pre: { // eslint-disable-line
      typeof lang === 'string'
      Array.isArray(resources)
    }
    AppDispatcher.dispatch({ action_type: AppConstants.LOCALE_UPDATE_DOWNLOADED, lang, resources })
  },

  locale_update_download_start: (lang) => {
    pre: { // eslint-disable-line
      typeof lang === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.LOCALE_UPDATE_DOWNLOAD_START, lang })
  },

  locale_update_download_end: (lang) => {
    pre: { // eslint-disable-line
      typeof lang === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.LOCALE_UPDATE_DOWNLOAD_END, lang })
  },

  /* Install locations */

  compute_install_location_size: (name) => {
    pre: { // eslint-disable-line
      typeof name === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.COMPUTE_INSTALL_LOCATION_SIZE, name })
  },

  cancel_install_location_size_computation: (name) => {
    pre: { // eslint-disable-line
      typeof name === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.CANCEL_INSTALL_LOCATION_SIZE_COMPUTATION, name })
  },

  browse_install_location: (name) => {
    pre: { // eslint-disable-line
      typeof name === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.BROWSE_INSTALL_LOCATION, name })
  },

  add_install_location_request: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.ADD_INSTALL_LOCATION_REQUEST })
  },

  add_install_location: (name, path) => {
    pre: { // eslint-disable-line
      typeof name === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.ADD_INSTALL_LOCATION, name, path })
  },

  remove_install_location_request: (name) => {
    AppDispatcher.dispatch({ action_type: AppConstants.REMOVE_INSTALL_LOCATION_REQUEST, name })
  },

  remove_install_location: (name) => {
    AppDispatcher.dispatch({ action_type: AppConstants.REMOVE_INSTALL_LOCATION, name })
  },

  transfer_install_location: (name, new_path) => {
    pre: { // eslint-disable-line
      typeof name === 'string'
      typeof new_path === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.TRANSFER_INSTALL_LOCATION, name, new_path })
  },

  make_install_location_default: (name) => {
    pre: { // eslint-disable-line
      typeof name === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.MAKE_INSTALL_LOCATION_DEFAULT, name })
  },

  /* Caves */

  request_cave_uninstall: (id) => {
    pre: { // eslint-disable-line
      typeof id === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.REQUEST_CAVE_UNINSTALL, id })
  },

  queue_cave_uninstall: (id) => {
    pre: { // eslint-disable-line
      typeof id === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.QUEUE_CAVE_UNINSTALL, id })
  },

  queue_cave_reinstall: (id) => {
    pre: { // eslint-disable-line
      typeof id === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.QUEUE_CAVE_REINSTALL, id })
  },

  update_cave: (id, cave) => {
    pre: { // eslint-disable-line
      typeof id === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.UPDATE_CAVE, id, cave })
  },

  cave_progress: (data) => {
    pre: { // eslint-disable-line
      typeof data === 'object'
      typeof data.id === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.CAVE_PROGRESS, data })
  },

  cancel_cave: (id) => {
    pre: { // eslint-disable-line
      typeof id === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.CANCEL_CAVE, id })
  },

  implode_cave: (id) => {
    pre: { // eslint-disable-line
      typeof id === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.IMPLODE_CAVE, id })
  },

  explore_cave: (id) => {
    pre: { // eslint-disable-line
      typeof id === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.EXPLORE_CAVE, id })
  },

  cave_thrown_into_bit_bucket: (id) => {
    pre: { // eslint-disable-line
      typeof id === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.CAVE_THROWN_INTO_BIT_BUCKET, id })
  },

  probe_cave: (id) => {
    pre: { // eslint-disable-line
      typeof id === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.PROBE_CAVE, id })
  },

  report_cave: (id) => {
    pre: { // eslint-disable-line
      typeof id === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.REPORT_CAVE, id })
  },

  /* Packaging policy */

  show_packaging_policy: (format, game_id) => {
    pre: { // eslint-disable-line
      typeof format === 'string'
      typeof game_id === 'number'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.SHOW_PACKAGING_POLICY, format, game_id })
  },

  /* Games */

  queue_game: (game) => {
    pre: { // eslint-disable-line
      typeof game === 'object'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.QUEUE_GAME, game })
  },

  browse_game: (id, url) => {
    pre: { // eslint-disable-line
      typeof id === 'number'
      typeof url === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.BROWSE_GAME, id, url })
  },

  initiate_purchase: (game) => {
    pre: { // eslint-disable-line
      typeof game === 'object'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.INITIATE_PURCHASE, game })
  },

  purchase_completed: (id, message) => {
    pre: { // eslint-disable-line
      typeof id === 'number'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.PURCHASE_COMPLETED, id, message })
  },

  set_progress: (alpha) => {
    AppDispatcher.dispatch({ action_type: AppConstants.SET_PROGRESS, alpha })
  },

  bounce: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.BOUNCE })
  },

  notify: (message) => {
    pre: { // eslint-disable-line
      typeof message === 'string'
    }
    AppDispatcher.dispatch({ action_type: AppConstants.NOTIFY, message })
  },

  no_stored_credentials: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.NO_STORED_CREDENTIALS })
  },

  attempt_login: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.ATTEMPT_LOGIN })
  },

  login_with_password: (username, password) => {
    pre: { // eslint-disable-line
      typeof username === 'string'
      typeof password === 'string'
    }
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

  fetch_search: (query) => {
    AppDispatcher.dispatch({ action_type: AppConstants.FETCH_SEARCH, query })
  },

  search_fetched: (query) => {
    AppDispatcher.dispatch({ action_type: AppConstants.SEARCH_FETCHED, query })
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

  quit_when_main: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.QUIT_WHEN_MAIN })
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

  cave_store_cave_diff: (cave, diff) => {
    AppDispatcher.dispatch({ action_type: AppConstants.CAVE_STORE_CAVE_DIFF, cave, diff })
  },

  install_location_store_diff: (diff) => {
    AppDispatcher.dispatch({ action_type: AppConstants.INSTALL_LOCATION_STORE_DIFF, diff })
  },

  implode_app: () => {
    AppDispatcher.dispatch({ action_type: AppConstants.IMPLODE_APP })
  }
}

module.exports = self
