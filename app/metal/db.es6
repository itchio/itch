
import Promise from "bluebird";
import Datastore from "nedb";
import mkdirp from "mkdirp";
import path from "path";
import app from "app";
import _ from "underscore";

let library_dir = path.join(app.getPath("home"), "Downloads", "itch.io");
mkdirp.sync(library_dir);

export let store = new Datastore({
  filename: path.join(library_dir, "db.dat"),
  autoload: true
});

// returns true if field name looks like a date field
function is_date (name) {
  return /_at$/.test(name);
}

// parse date returned by itch.io API, make a Javascript Date object out of it
// assumes UTC, throws on parsing error
function to_date (text) {
  let matches = text.match(/^(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)(\.\d*)?$/);
  if (!matches) {
    throw new Error("Invalid date: #{text}");
  }
  let [, year, month, day, hour, min, sec] = matches;
  return new Date(Date.UTC(year, month - 1, day, hour, min, sec));
}

export let insert = Promise.promisify(store.insert, store);
export let update = Promise.promisify(store.update, store);
export let find = Promise.promisify(store.find, store);
export let find_one = Promise.promisify(store.findOne, store);

export function save_download_keys(keys) {
  if (keys.length == 0) return Promise.resolve();

  let games = [];
  let promises = [];
  for (let key of keys) {
    let record = {_table: 'download_keys'}
    for (let [name, field] of _.pairs(key)) {
      switch (true) {
        case typeof(field) == 'object':
          switch (name) {
            case 'game':
              record.game_id = field.id;
              games.push(field);
              break;
          }
          break;
        case is_date(name):
          record[name] = to_date(field);
          break;
        default:
          record[name] = field;
          break;
      }
    }

    promises.push(update({
      _table: 'download_keys',
      id: key.id
    }, record, {upsert: true}));
  }

  promises.push(save_games(games));
  return Promise.all(promises);
}

export function save_users (users) {
  if (users.length == 0) return Promise.resolve();
  
  let promises = [];
  for (let user of users) {
    let record = { _table: 'users' }
    for (let [name, field] of _.pairs(user)) {
      switch (true) {
        case typeof(field) == 'object':
          break;
        case is_date(name):
          record[name] = to_date(field);
          break;
        default:
          record[name] = field
          break;
      }
    }

    promises.push(update({
      _table: 'users',
      id: user.id
    }, record, {upsert: true}));
  }

  return Promise.all(promises);
}

export function save_games (games) {
  if (games.length == 0) return Promise.resolve();

  let users = [];
  let keys = [];
  let promises = [];

  for (let game of games) {
    let record = {_table: 'games'};
    for (let [name, field] of _.pairs(game)) {
      switch (true) {
        case typeof(field) == 'object':
          switch (name) {
            case "key":
              keys.push(field);
              break;
            case "user":
              users.push(field);
              record.user_id = field.id;
              break;
          }
          break;
        case is_date(name):
          record[name] = to_date(field);
          break;
        default:
          record[name] = field;
          break;
      }
    }

    promises.push(update({
      _table: 'games',
      id: record.id
    }, record, {upsert: true}));
  }

  promises.push(save_users(users));
  promises.push(save_download_keys(keys));
  return Promise.all(promises);
}

export function save_collections (collections) {
  if (collections.length == 0) return;

  let games = [];
  let promises = [];

  for (let collection of collections) {
    let record = {_table: 'collections'};
    for (let [name, field] of _.pairs(collection)) {
      switch (true) {
        case typeof(field) == 'object':
          switch (name) {
            case "games":
              record.game_ids = _.pluck(field, 'id');
              games = games.concat(field);
              break;
          }
          break;
        case is_date(name):
          record[name] = to_date(field);
          break;
        default:
          record[name] = field;
          break;
      }
    }

    promises.push(update({
      _table: 'collections',
      id: collection.id
    }, record, {upsert: true}));
  }

  promises.push(save_games(games));
  return Promise.all(promises);
}

