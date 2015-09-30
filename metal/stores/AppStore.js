(function() {
  var AppActions, AppConstants, AppDispatcher, AppStore, CHANGE_EVENT, EventEmitter, Immutable, _, api, app, assign, config, current_user, db, defer, fetch_games, focus_panel, focus_window, login_done, login_key, login_with_password, merge_state, state, switch_page;

  EventEmitter = require("events").EventEmitter;

  Immutable = require("seamless-immutable");

  assign = require("object-assign");

  _ = require("underscore");

  AppDispatcher = require("../dispatcher/AppDispatcher");

  AppConstants = require("../constants/AppConstants");

  AppActions = require("../actions/AppActions");

  defer = require("../defer");

  app = require("app");

  config = require("../config");

  api = require("../api");

  db = require("../db");

  CHANGE_EVENT = "change";

  state = Immutable({
    page: "login",
    library: {
      me: null,
      game: null,
      games: [],
      panel: null,
      collections: {},
      installs: {}
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
    get_state_json: function() {
      return JSON.stringify(state);
    },
    get_current_user: function() {
      return current_user;
    }
  });

  fetch_games = function() {
    var collection, fetch, id, panel, show_own_games, show_owned_games, type, user;
    user = current_user;
    panel = state.library.panel;
    return fetch = (function() {
      var ref;
      switch (panel) {
        case "dashboard":
          show_own_games = function() {
            var own_id;
            own_id = state.library.me.id;
            return db.find({
              _table: 'games',
              user_id: own_id
            }).then(Immutable).then(function(games) {
              console.log("found " + games.length + " own games");
              merge_state({
                library: {
                  games: games
                }
              });
              return AppStore.emit_change();
            });
          };
          show_own_games();
          return user.my_games().then(function(res) {
            return res.games.map(function(game) {
              game.user = state.library.me;
              return game;
            });
          }).then(db.save_games).then(function() {
            return show_own_games();
          });
        case "owned":
          show_owned_games = function() {
            return db.find({
              _table: 'download_keys'
            }).then(function(keys) {
              return _.pluck(keys, 'game_id');
            }).then(function(game_ids) {
              return db.find({
                _table: 'games',
                id: {
                  $in: game_ids
                }
              });
            }).then(Immutable).then(function(games) {
              merge_state({
                library: {
                  games: games
                }
              });
              return AppStore.emit_change();
            });
          };
          show_owned_games();
          return user.my_owned_keys().then((function(_this) {
            return function(res) {
              return res.owned_keys.map(function(key) {
                return key.game.merge({
                  key: key.without("game")
                });
              });
            };
          })(this)).then(db.save_games).then(function() {
            return show_owned_games();
          });
        default:
          ref = panel.split("/"), type = ref[0], id = ref[1];
          switch (type) {
            case "collections":
              collection = state.library.collections[id];
              console.log("trying to show collection " + (JSON.stringify(collection)));
              console.log("game ids = " + (JSON.stringify(collection.game_ids)));
              return db.find({
                _table: 'games',
                id: {
                  $in: collection.game_ids
                }
              }).then((function(_this) {
                return function(games) {
                  return merge_state({
                    library: {
                      games: games
                    }
                  });
                };
              })(this));
            default:
              return merge_state({
                library: {
                  games: []
                }
              });
          }
      }
    }).call(this);
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
        return defer(function() {
          return AppActions.login_done(key);
        });
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
        return defer(function() {
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
        });
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
    AppStore.emit_change();
    return defer(function() {
      var show_collections;
      show_collections = function() {
        return db.find({
          _table: 'collections'
        }).then((function(_this) {
          return function(collections) {
            console.log("found " + collections.length + " collections");
            return _.indexBy(collections, "id");
          };
        })(this)).then((function(_this) {
          return function(collections) {
            merge_state({
              library: {
                collections: collections
              }
            });
            return AppStore.emit_change();
          };
        })(this));
      };
      show_collections();
      return current_user.my_collections().then(function(res) {
        return res.collections;
      }).then(db.save_collections).then(function() {
        return show_collections();
      });
    });
  };

  AppDispatcher.register(function(action) {
    var installs, key, library, obj1;
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
      case AppConstants.INSTALL_PROGRESS:
        installs = (
          obj1 = {},
          obj1["" + action.opts.id] = action.opts,
          obj1
        );
        merge_state({
          library: {
            installs: installs
          }
        });
        return AppStore.emit_change();
    }
  });

  module.exports = AppStore;

}).call(this);
