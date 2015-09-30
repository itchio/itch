
{ EventEmitter } = require "events"
Immutable = require "seamless-immutable"
assign = require "object-assign"
_ = require "underscore"

AppDispatcher = require "../dispatcher/AppDispatcher"
AppConstants = require "../constants/AppConstants"
AppActions = require "../actions/AppActions"
defer = require "../defer"

app = require "app"

config = require "../config"
api = require "../api"
db = require "../db"

CHANGE_EVENT = "change"

state = Immutable {
  page: "login"

  library: {
    me: null
    game: null
    games: []
    panel: null
    collections: {}
    installs: {}
  }

  login: {
    loading: false
  }
}

current_user = null

merge_state = (obj) ->
  state = state.merge obj, deep: true

AppStore = assign {}, EventEmitter.prototype, {
  listeners: {}

  emit_change: ->
    @emit CHANGE_EVENT

  add_change_listener: (name, callback) ->
    @listeners[name] = callback
    @on CHANGE_EVENT, callback
    console.log "Added listener '#{name}', #{@listenerCount CHANGE_EVENT} left"

  remove_change_listener: (name) ->
    callback = @listeners[name]
    unless callback
      console.log "Can't remove non-listener '#{name}'"
      return
    delete @listeners[name]
    @removeListener CHANGE_EVENT, callback
    console.log "Removed listener '#{name}', #{@listenerCount CHANGE_EVENT} left"

  get_state: ->
    state

  get_state_json: ->
    JSON.stringify state

  get_current_user: ->
    current_user

}

fetch_games = ->
  user = current_user
  { panel } = state.library

  fetch = switch panel

    when "dashboard"
      show_own_games = ->
        own_id = state.library.me.id
        db.find(_table: 'games', user_id: own_id).then(Immutable).then((games) ->
          console.log "found #{games.length} own games"
          merge_state { library: { games } }
          AppStore.emit_change()
        )

      show_own_games()

      user.my_games().then((res) ->
        res.games.map (game) ->
          game.user = state.library.me
          game
      ).then(db.save_games).then -> show_own_games()

    when "owned"
      show_owned_games = ->
        db.find(_table: 'download_keys').then((keys) ->
          _.pluck keys, 'game_id'
        ).then((game_ids) ->
          db.find(_table: 'games', id: { $in: game_ids })
        ).then(Immutable).then((games) ->
          merge_state { library: { games } }
          AppStore.emit_change()
        )

      show_owned_games()

      user.my_owned_keys().then((res) =>
        res.owned_keys.map (key) ->
          # flip it around!
          key.game.merge { key: key.without("game") }
      ).then(db.save_games).then( ->
        show_owned_games()
      )

    else
      [type, id] = panel.split "/"
      switch type
        when "collections"
          collection = state.library.collections[id]
          console.log "trying to show collection #{JSON.stringify collection}"
          console.log "game ids = #{JSON.stringify collection.game_ids}"
          db.find(_table: 'games', id: {$in: collection.game_ids}).then((games) =>
            merge_state { library: { games } }
            AppStore.emit_change()
          )
        else
          merge_state { library: { games: [] } }
          AppStore.emit_change()

focus_window = ->
  require("app").main_window?.show()

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
    merge_state { library: { me: res.user } }
    defer -> AppActions.login_done key
  ).catch((errors) =>
    merge_state { login: { errors } }
  ).finally =>
    merge_state { login: { loading: false } }
    AppStore.emit_change()

login_with_password = (username, password) ->
  merge_state { login: { loading: true } }
  AppStore.emit_change()

  api.client.login_with_password(username, password).then((res) =>
    defer ->
      AppActions.login_done res.key.key
      current_user.me().then((res) =>
        merge_state { library: { me: res.user } }
      )
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

  defer ->
    show_collections = ->
      db.find(_table: 'collections').then((collections) =>
        console.log "found #{collections.length} collections"
        _.indexBy collections, "id"
      ).then((collections) =>
        merge_state { library: { collections } }
        AppStore.emit_change()
      )

    show_collections()

    current_user.my_collections().then((res) ->
      res.collections
    ).then(db.save_collections).then -> show_collections()

AppDispatcher.register (action) ->
  # console.log action.action_type

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
      focus_window()
      focus_panel action.panel

    when AppConstants.FOCUS_WINDOW
      focus_window()

    when AppConstants.LOGIN_WITH_PASSWORD
      login_with_password action.username, action.password

    when AppConstants.LOGIN_DONE
      login_done action.key

    when AppConstants.LOGOUT
      config.clear "api_key"
      state = state.merge library: state.library.without("me")
      merge_state { page: "login" }
      AppStore.emit_change()

    when AppConstants.BOOT
      if key = config.get "api_key"
        login_key(key)

    when AppConstants.QUIT
      require("app").quit()

    when AppConstants.INSTALL_PROGRESS
      installs = { "#{action.opts.id}": action.opts }
      merge_state { library: { installs } }
      AppStore.emit_change()

module.exports = AppStore

