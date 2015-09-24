
{ EventEmitter } = require "events"
Immutable = require "seamless-immutable"
assign = require "object-assign"

AppDispatcher = require "../dispatcher/AppDispatcher"
AppConstants = require "../constants/AppConstants"
AppActions = require "../actions/AppActions"

config = require "../config"
api = require "../api"

CHANGE_EVENT = 'change'

state = Immutable {
  page: "login"

  library: {
    game: null
    games: []
    panel: null
  }

  login: {
    loading: false
  }
}

current_user = null

merge_state = (obj) ->
  state = state.merge obj, deep: true

AppStore = assign {}, EventEmitter.prototype, {

  emit_change: ->
    @emit CHANGE_EVENT

  add_change_listener: (callback) ->
    @on CHANGE_EVENT, callback

  remove_change_listener: (callback) ->
    @removeListener CHANGE_EVENT, callback

  get_state: ->
    state

  get_current_user: ->
    current_user

}

fetch_games = ->
  user = current_user
  fetch = switch state.library.panel
    when "dashboard"
      user.my_games().then (res) ->
        res.games
    when "owned"
      user.my_owned_keys().then (res) =>
        res.owned_keys.map (key) ->
          # flip it around!
          key.game.merge { key: key.without("game") }

  fetch.then (games) =>
    merge_state { library: { games: games } }
    AppStore.emit_change()

focus_panel = (panel) ->
  merge_state {
    page: "library"
    library: {
      panel
      games: []
    }
  }
  AppStore.emit_change()

  fetch_games()

switch_page = (page) ->
  merge_state { page }
  AppStore.emit_change()

login_key = (key) ->
  merge_state { login: { loading: true } }
  AppStore.emit_change()

  api.client.login_key(key).then((res) =>
    setTimeout (-> AppActions.login_done key), 0
  ).catch((errors) =>
    merge_state { login: { errors } }
  ).finally =>
    merge_state { login: { loading: false } }
    AppStore.emit_change()

login_with_password = (username, password) ->
  merge_state { login: { loading: true } }
  AppStore.emit_change()

  api.client.login_with_password(username, password).then((res) =>
    setTimeout (-> AppActions.login_done res.key.key), 0
  ).catch((errors) =>
    merge_state { login: { errors } }
  ).finally =>
    merge_state { login: { loading: false } }
    AppStore.emit_change()

login_done = (key) ->
  config.set "api_key", key
  current_user = new api.User(api.client, key)
  focus_panel "owned"
  AppStore.emit_change()

AppDispatcher.register (action) ->
  console.log action.action_type

  switch action.action_type

    when AppConstants.SWITCH_PAGE
      switch_page action.page
      AppStore.emit_change()

    when AppConstants.LIBRARY_VIEW_GAME
      merge_state { library: { game: action.game } }
      AppStore.emit_change()

    when AppConstants.LIBRARY_CLOSE_GAME
      library = state.library.without("game")
      state = state.merge { library }
      AppStore.emit_change()

    when AppConstants.LIBRARY_FOCUS_PANEL
      focus_panel action.panel

    when AppConstants.LOGIN_WITH_PASSWORD
      login_with_password action.username, action.password

    when AppConstants.LOGIN_DONE
      login_done action.key

    when AppConstants.LOGOUT
      config.set "api_key", null
      merge_state { page: "login" }
      AppStore.emit_change()

    when AppConstants.BOOT
      if key = config.get "api_key"
        login_key(key)

    when AppConstants.QUIT
      require("app").quit()

module.exports = AppStore

