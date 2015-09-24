(function() {
  var AppActions, AppConstants, AppDispatcher, AppStore, CHANGE_EVENT, EventEmitter, Immutable, api, assign, config, current_user, fetch_games, focus_panel, login_done, login_key, login_with_password, merge_state, state, switch_page;

  EventEmitter = require("events").EventEmitter;

  Immutable = require("seamless-immutable");

  assign = require("object-assign");

  AppDispatcher = require("../dispatcher/AppDispatcher");

  AppConstants = require("../constants/AppConstants");

  AppActions = require("../actions/AppActions");

  config = require("../config");

  api = require("../api");

  CHANGE_EVENT = 'change';

  state = Immutable({
    page: "login",
    library: {
      game: null,
      games: [],
      panel: null
    },
    login: {
      loading: false
    }
  });

  current_user = null;

  merge_state = function(obj) {
    return state = state.merge(obj, {
      deep: true
    });
  };

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
    },
    get_current_user: function() {
      return current_user;
    }
  });

  fetch_games = function() {
    var fetch, user;
    user = current_user;
    fetch = (function() {
      switch (state.library.panel) {
        case "dashboard":
          return user.my_games().then(function(res) {
            return res.games;
          });
        case "owned":
          return user.my_owned_keys().then((function(_this) {
            return function(res) {
              return res.owned_keys.map(function(key) {
                return key.game.merge({
                  key: key.without("game")
                });
              });
            };
          })(this));
      }
    }).call(this);
    return fetch.then((function(_this) {
      return function(games) {
        merge_state({
          library: {
            games: games
          }
        });
        return AppStore.emit_change();
      };
    })(this));
  };

  focus_panel = function(panel) {
    merge_state({
      page: "library",
      library: {
        panel: panel,
        games: []
      }
    });
    AppStore.emit_change();
    return fetch_games();
  };

  switch_page = function(page) {
    merge_state({
      page: page
    });
    return AppStore.emit_change();
  };

  login_key = function(key) {
    merge_state({
      login: {
        loading: true
      }
    });
    AppStore.emit_change();
    return api.client.login_key(key).then((function(_this) {
      return function(res) {
        return setTimeout((function() {
          return AppActions.login_done(key);
        }), 0);
      };
    })(this))["catch"]((function(_this) {
      return function(errors) {
        return merge_state({
          login: {
            errors: errors
          }
        });
      };
    })(this))["finally"]((function(_this) {
      return function() {
        merge_state({
          login: {
            loading: false
          }
        });
        return AppStore.emit_change();
      };
    })(this));
  };

  login_with_password = function(username, password) {
    merge_state({
      login: {
        loading: true
      }
    });
    AppStore.emit_change();
    return api.client.login_with_password(username, password).then((function(_this) {
      return function(res) {
        return setTimeout((function() {
          return AppActions.login_done(res.key.key);
        }), 0);
      };
    })(this))["catch"]((function(_this) {
      return function(errors) {
        return merge_state({
          login: {
            errors: errors
          }
        });
      };
    })(this))["finally"]((function(_this) {
      return function() {
        merge_state({
          login: {
            loading: false
          }
        });
        return AppStore.emit_change();
      };
    })(this));
  };

  login_done = function(key) {
    config.set("api_key", key);
    current_user = new api.User(api.client, key);
    focus_panel("owned");
    return AppStore.emit_change();
  };

  AppDispatcher.register(function(action) {
    var key, library;
    console.log(action.action_type);
    switch (action.action_type) {
      case AppConstants.SWITCH_PAGE:
        switch_page(action.page);
        return AppStore.emit_change();
      case AppConstants.LIBRARY_VIEW_GAME:
        merge_state({
          library: {
            game: action.game
          }
        });
        return AppStore.emit_change();
      case AppConstants.LIBRARY_CLOSE_GAME:
        library = state.library.without("game");
        state = state.merge({
          library: library
        });
        return AppStore.emit_change();
      case AppConstants.LIBRARY_FOCUS_PANEL:
        return focus_panel(action.panel);
      case AppConstants.LOGIN_WITH_PASSWORD:
        return login_with_password(action.username, action.password);
      case AppConstants.LOGIN_DONE:
        return login_done(action.key);
      case AppConstants.LOGOUT:
        config.set("api_key", null);
        merge_state({
          page: "login"
        });
        return AppStore.emit_change();
      case AppConstants.BOOT:
        if (key = config.get("api_key")) {
          return login_key(key);
        }
        break;
      case AppConstants.QUIT:
        return require("app").quit();
    }
  });

  module.exports = AppStore;

}).call(this);
