(function() {
  var Datastore, Promise, _, app, find, findOne, insert, is_date, library_dir, mkdirp, path, save_collections, save_download_keys, save_games, save_users, store, to_date, update;

  Promise = require("bluebird");

  Datastore = require("nedb");

  mkdirp = require("mkdirp");

  path = require("path");

  app = require("app");

  _ = require("underscore");

  library_dir = path.join(app.getPath("home"), "Downloads", "itch.io");

  mkdirp.sync(library_dir);

  store = new Datastore({
    filename: path.join(library_dir, "db.dat"),
    autoload: true
  });

  is_date = function(name) {
    return /_at$/.test(name);
  };

  to_date = function(text) {
    var day, hour, meh, min, month, ref, sec, year;
    ref = text.match(/^(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)(\.\d*)?$/ || (function() {
      throw new Error("Invalid date: " + text);
    })()), meh = ref[0], year = ref[1], month = ref[2], day = ref[3], hour = ref[4], min = ref[5], sec = ref[6];
    return new Date(Date.UTC(year, month - 1, day, hour, min, sec));
  };

  insert = Promise.promisify(store.insert, store);

  update = Promise.promisify(store.update, store);

  find = Promise.promisify(store.find, store);

  findOne = Promise.promisify(store.findOne, store);

  save_download_keys = function(keys) {
    var field, games, key, name, promises, record;
    if (!keys.length) {
      return Promise.resolve();
    }
    games = [];
    promises = (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = keys.length; i < len; i++) {
        key = keys[i];
        record = {
          _table: 'download_keys'
        };
        for (name in key) {
          field = key[name];
          switch (false) {
            case typeof field !== 'object':
              switch (name) {
                case 'game':
                  record.game_id = field.id;
                  games.push(field);
              }
              break;
            case !is_date(name):
              record[name] = to_date(field);
              break;
            default:
              record[name] = field;
          }
        }
        results.push(update({
          _table: 'download_keys',
          id: key.id
        }, record, {
          upsert: true
        }));
      }
      return results;
    })();
    promises.push(save_games(games));
    return Promise.all(promises);
  };

  save_users = function(users) {
    var field, name, promises, record, user;
    if (!users.length) {
      return Promise.resolve();
    }
    promises = (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = users.length; i < len; i++) {
        user = users[i];
        record = {
          _table: 'users'
        };
        for (name in user) {
          field = user[name];
          switch (false) {
            case typeof field !== 'object':
              continue;
            case !is_date(name):
              record[name] = to_date(field);
              break;
            default:
              record[name] = field;
          }
        }
        results.push(update({
          _table: 'users',
          id: user.id
        }, record, {
          upsert: true
        }));
      }
      return results;
    })();
    return Promise.all(promises);
  };

  save_games = function(games) {
    var field, game, keys, name, promises, record, users;
    if (!games.length) {
      return;
    }
    users = [];
    keys = [];
    promises = (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = games.length; i < len; i++) {
        game = games[i];
        record = {
          _table: 'games'
        };
        for (name in game) {
          field = game[name];
          switch (false) {
            case typeof field !== 'object':
              switch (name) {
                case "key":
                  keys.push(field);
                  break;
                case "user":
                  users.push(field);
                  record.user_id = field.id;
              }
              break;
            case !is_date(name):
              record[name] = to_date(field);
              break;
            default:
              record[name] = field;
          }
        }
        results.push(update({
          _table: 'games',
          id: record.id
        }, record, {
          upsert: true
        }));
      }
      return results;
    })();
    promises.push(save_users(users));
    promises.push(save_download_keys(keys));
    return Promise.all(promises);
  };

  save_collections = function(collections) {
    var collection, field, games, name, promises, record;
    if (!collections.length) {
      return;
    }
    games = [];
    promises = (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = collections.length; i < len; i++) {
        collection = collections[i];
        record = {
          _table: 'collections'
        };
        for (name in collection) {
          field = collection[name];
          switch (false) {
            case typeof field !== 'object':
              switch (name) {
                case "games":
                  record.game_ids = _.pluck(field, 'id');
                  games = games.concat(field);
              }
              break;
            case !is_date(name):
              record[name] = to_date(field);
              break;
            default:
              record[name] = field;
          }
        }
        results.push(update({
          _table: 'collections',
          id: collection.id
        }, record, {
          upsert: true
        }));
      }
      return results;
    })();
    promises.push(save_games(games));
    return Promise.all(promises);
  };

  module.exports = {
    store: store,
    save_download_keys: save_download_keys,
    save_users: save_users,
    save_games: save_games,
    save_collections: save_collections,
    insert: insert,
    update: update,
    find: find,
    findOne: findOne
  };

}).call(this);

//# sourceMappingURL=../app/maps/metal/db.js.map
