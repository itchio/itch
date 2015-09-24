(function() {
  var AppActions, AppConstants, AppDispatcher, AppStore, CHANGE_EVENT, EventEmitter, Immutable, api, assign, config, fetch_games, focus_panel, login_done, login_key, login_with_password, state, switch_page;

  EventEmitter = require("events").EventEmitter;

  Immutable = require("immutable");

  assign = require("object-assign");

  AppDispatcher = require("../dispatcher/AppDispatcher");

  AppConstants = require("../constants/AppConstants");

  AppActions = require("../actions/AppActions");

  config = require("../config");

  api = require("../api");

  CHANGE_EVENT = 'change';

  state = Immutable.fromJS({
    page: "login",
    current_user: null,
    library: {
      game: null,
      games: [],
      panel: "owned"
    },
    login: {
      loading: false
    }
  });

  AppStore = assign({}, EventEmitter.prototype, {
    emit_change: function() {
      return this.emit(CHANGE_EVENT);
    },
    add_change_listener: function(callback) {
      return this.on(CHANGE_EVENT, callback);
    },
    remove_change_listener: function(callback) {
      return this.removeListener(CHANGE_EVENT, callback);
    },
    get_state: function() {
      return state;
    }
  });

  fetch_games = function() {
    var fetch, user;
    user = state.get("current_user");
    fetch = (function() {
      switch (state.getIn(["library", "panel"])) {
        case "dashboard":
          return user.my_games().then(function(res) {
            return res.get("games");
          });
        case "owned":
          return user.my_owned_keys().then((function(_this) {
            return function(res) {
              return res.get("owned_keys").map(function(key) {
                var game;
                game = key.get("game");
                return game.set("key", key["delete"]("game"));
              });
            };
          })(this));
      }
    }).call(this);
    return fetch.then((function(_this) {
      return function(games) {
        state = state.setIn(["library", "games"], games);
        return AppStore.emit_change();
      };
    })(this));
  };

  focus_panel = function(panel) {
    state = state.set("page", "library");
    state = state.setIn(["library", "panel"], panel);
    state = state.setIn(["library", "games"], Immutable.List());
    AppStore.emit_change();
    return fetch_games();
  };

  switch_page = function(page) {
    state = state.set("page", page);
    return AppStore.emit_change();
  };

  login_key = function(key) {
    state = state.setIn(["login", "loading"], true);
    AppStore.emit_change();
    console.log("Logging in with " + key);
    return api.client.login_key(key).then((function(_this) {
      return function(res) {
        return login_done(key);
      };
    })(this))["catch"]((function(_this) {
      return function(errors) {
        console.log("login with key, errors = ", errors);
        return state = state.setIn(["login", "errors"], errors);
      };
    })(this))["finally"]((function(_this) {
      return function() {
        state = state.setIn(["login", "loading"], false);
        return AppStore.emit_change();
      };
    })(this));
  };

  login_with_password = function(username, password) {
    state = state.setIn(["login", "loading"], true);
    AppStore.emit_change();
    return api.client.login_with_password(username, password).then((function(_this) {
      return function(res) {
        return login_done(res.get("key"));
      };
    })(this))["catch"]((function(_this) {
      return function(errors) {
        console.log("login with password, errors = ", errors);
        return state = state.setIn(["login", "errors"], errors);
      };
    })(this))["finally"]((function(_this) {
      return function() {
        state = state.setIn(["login", "loading"], false);
        return AppStore.emit_change();
      };
    })(this));
  };

  login_done = function(key) {
    console.log("login done: " + key);
    config.set("api_key", key);
    state = state.set("current_user", new api.User(api.client, key));
    state = state.set("page", "library");
    return AppStore.emit_change();
  };

  AppDispatcher.register(function(action) {
    var key;
    console.log(action.action_type);
    switch (action.action_type) {
      case AppConstants.SWITCH_PAGE:
        state = state.set("page", action.page);
        return AppStore.emit_change();
      case AppConstants.LIBRARY_VIEW_GAME:
        state = state.setIn(["library", "game"], action.game);
        return AppStore.emit_change();
      case AppConstants.LIBRARY_CLOSE_GAME:
        state = state.deleteIn(["library", "game"]);
        return AppStore.emit_change();
      case AppConstants.LIBRARY_FOCUS_PANEL:
        return focus_panel(action.panel);
      case AppConstants.LOGIN_WITH_PASSWORD:
        return login_with_password(action.username, action.password);
      case AppConstants.LOGOUT:
        config.set("api_key", null);
        state = state.set("page", "login");
        return AppStore.emit_change();
      case AppConstants.BOOT:
        if (key = config.get("api_key")) {
          console.log("Found api key stored, logging in..");
          return login_key(key);
        }
        break;
      case AppConstants.QUIT:
        return require("app").quit();
    }
  });

  module.exports = AppStore;

}).call(this);
