(function() {
  var AppActions, AppConstants, AppDispatcher, AppStore, CHANGE_EVENT, EventEmitter, Immutable, api, app, assign, config, current_user, fetch_games, focus_panel, focus_window, login_done, login_key, login_with_password, merge_state, state, switch_page;

  EventEmitter = require("events").EventEmitter;

  Immutable = require("seamless-immutable");

  assign = require("object-assign");

  AppDispatcher = require("../dispatcher/AppDispatcher");

  AppConstants = require("../constants/AppConstants");

  AppActions = require("../actions/AppActions");

  app = require("app");

  config = require("../config");

  api = require("../api");

  CHANGE_EVENT = 'change';

  state = Immutable({
    page: "login",
    library: {
      me: null,
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
    listeners: {},
    emit_change: function() {
      return this.emit(CHANGE_EVENT);
    },
    add_change_listener: function(name, callback) {
      this.listeners[name] = callback;
      this.on(CHANGE_EVENT, callback);
      return console.log("Added listener '" + name + "', " + (this.listenerCount(CHANGE_EVENT)) + " left");
    },
    remove_change_listener: function(name) {
      var callback;
      callback = this.listeners[name];
      if (!callback) {
        console.log("Can't remove non-listener '" + name + "'");
        return;
      }
      delete this.listeners[name];
      this.removeListener(CHANGE_EVENT, callback);
      return console.log("Removed listener '" + name + "', " + (this.listenerCount(CHANGE_EVENT)) + " left");
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

  focus_window = function() {
    var ref;
    return (ref = require("app").main_window) != null ? ref.show() : void 0;
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
        merge_state({
          library: {
            me: res.user
          }
        });
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
          AppActions.login_done(res.key.key);
          return current_user.me().then((function(_this) {
            return function(res) {
              return merge_state({
                library: {
                  me: res.user
                }
              });
            };
          })(this));
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
        focus_window();
        return focus_panel(action.panel);
      case AppConstants.FOCUS_WINDOW:
        return focus_window();
      case AppConstants.LOGIN_WITH_PASSWORD:
        return login_with_password(action.username, action.password);
      case AppConstants.LOGIN_DONE:
        return login_done(action.key);
      case AppConstants.LOGOUT:
        config.clear("api_key");
        state = state.merge({
          library: state.library.without("me")
        });
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
