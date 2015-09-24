
{ EventEmitter } = require "events"
Immutable = require "immutable"
assign = require "object-assign"

AppDispatcher = require "../dispatcher/AppDispatcher"
AppConstants = require "../constants/AppConstants"
AppActions = require "../actions/AppActions"

config = require "../config"
api = require "../api"

CHANGE_EVENT = 'change'

state = Immutable.fromJS {
  page: "login"
  current_user: null
  library: {
    game: null
    games: []
    panel: "owned"
  }
  login: {
    loading: false
  }
}

AppStore = assign {}, EventEmitter.prototype, {

  emit_change: ->
    @emit CHANGE_EVENT

  add_change_listener: (callback) ->
    @on CHANGE_EVENT, callback

  remove_change_listener: (callback) ->
    @removeListener CHANGE_EVENT, callback

  get_state: ->
    state

}

fetch_games = ->
  user = state.get "current_user"
  fetch = switch state.getIn ["library", "panel"]
    when "dashboard"
      user.my_games().then (res) ->
        res.get "games"
    when "owned"
      user.my_owned_keys().then (res) =>
        res.get("owned_keys").map (key) ->
          # flip it around!
          game = key.get("game")
          game.set("key", key.delete("game"))

  fetch.then (games) =>
    state = state.setIn ["library", "games"], games
    AppStore.emit_change()

focus_panel = (panel) ->
  state = state.set "page", "library"
  state = state.setIn ["library", "panel"], panel
  state = state.setIn ["library", "games"], Immutable.List()
  AppStore.emit_change()

  fetch_games()

switch_page = (page) ->
  state = state.set "page", page
  AppStore.emit_change()

login_key = (key) ->
  state = state.setIn ["login", "loading"], true
  AppStore.emit_change()

  console.log "Logging in with #{key}"
  api.client.login_key(key).then((res) =>
    login_done key
  ).catch((errors) =>
    console.log "login with key, errors = ", errors
    state = state.setIn ["login", "errors"], errors
  ).finally =>
    state = state.setIn ["login", "loading"], false
    AppStore.emit_change()

login_with_password = (username, password) ->
  state = state.setIn ["login", "loading"], true
  AppStore.emit_change()

  api.client.login_with_password(username, password).then((res) =>
    login_done res.get("key")
  ).catch((errors) =>
    console.log "login with password, errors = ", errors
    state = state.setIn ["login", "errors"], errors
  ).finally =>
    state = state.setIn ["login", "loading"], false
    AppStore.emit_change()

login_done = (key) ->
  console.log "login done: #{key}"
  config.set "api_key", key
  state = state.set "current_user", new api.User(api.client, key)
  state = state.set "page", "library"
  AppStore.emit_change()

AppDispatcher.register (action) ->
  console.log action.action_type

  switch action.action_type

    when AppConstants.SWITCH_PAGE
      state = state.set "page", action.page
      AppStore.emit_change()

    when AppConstants.LIBRARY_VIEW_GAME
      state = state.setIn ["library", "game"], action.game
      AppStore.emit_change()

    when AppConstants.LIBRARY_CLOSE_GAME
      state = state.deleteIn ["library", "game"]
      AppStore.emit_change()

    when AppConstants.LIBRARY_FOCUS_PANEL
      focus_panel action.panel

    when AppConstants.LOGIN_WITH_PASSWORD
      login_with_password action.username, action.password

    when AppConstants.LOGOUT
      config.set "api_key", null
      state = state.set "page", "login"
      AppStore.emit_change()

    when AppConstants.BOOT
      if key = config.get "api_key"
        console.log "Found api key stored, logging in.."
        login_key(key)

    when AppConstants.QUIT
      require("app").quit()

module.exports = AppStore

