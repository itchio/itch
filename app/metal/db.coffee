
Promise = require "bluebird"
Datastore = require "nedb"
mkdirp = require "mkdirp"
path = require "path"
app = require "app"
_ = require "underscore"

library_dir = path.join(app.getPath("home"), "Downloads", "itch.io")
mkdirp.sync(library_dir)

store = new Datastore {
  filename: path.join(library_dir, "db.dat")
  autoload: true
}

# returns true if field name looks like a date field
is_date = (name) ->
  /_at$/.test name

# parse date returned by itch.io API, make a Javascript Date object out of it
# assumes UTC, throws on parsing error
to_date = (text) ->
  [ meh, year, month, day, hour, min, sec ] = text.match /^(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)(\.\d*)?$/ or
    throw new Error("Invalid date: #{text}")
  new Date(Date.UTC year, month - 1, day, hour, min, sec)

insert = Promise.promisify(store.insert, store)
update = Promise.promisify(store.update, store)
find = Promise.promisify(store.find, store)
findOne = Promise.promisify(store.findOne, store)

save_download_keys = (keys) ->
  return Promise.resolve() unless keys.length

  games = []
  promises = for key in keys
    record = { _table: 'download_keys' }
    for name, field of key
      switch
        when typeof(field) == 'object'
          switch name
            when 'game'
              record.game_id = field.id
              games.push field
        when is_date name
          record[name] = to_date field
        else
          record[name] = field

    update {
      _table: 'download_keys'
      id: key.id
    }, record, { upsert: true }

  promises.push save_games games
  Promise.all promises

save_users = (users) ->
  return Promise.resolve() unless users.length
  
  promises = for user in users
    record = { _table: 'users' }
    for name, field of user
      switch
        when typeof(field) == 'object'
          continue
        when is_date name
          record[name] = to_date field
        else
          record[name] = field
    update {
      _table: 'users'
      id: user.id
    }, record, { upsert: true }

  Promise.all promises

save_games = (games) ->
  return unless games.length

  users = []
  keys = []

  promises = for game in games
    record = { _table: 'games' }
    for name, field of game
      switch
        when typeof(field) == 'object'
          switch name
            when "key"
              keys.push field
            when "user"
              users.push field
              record.user_id = field.id
        when is_date name
          record[name] = to_date field
        else
          record[name] = field

    update {
      _table: 'games'
      id: record.id
    }, record, { upsert: true }

  promises.push save_users users
  promises.push save_download_keys keys
  Promise.all promises

save_collections = (collections) ->
  return unless collections.length

  games = []

  promises = for collection in collections
    record = { _table: 'collections' }
    for name, field of collection
      switch
        when typeof(field) == 'object'
          switch name
            when "games"
              record.game_ids = _.pluck field, 'id'
              games = games.concat(field)
        when is_date name
          record[name] = to_date field
        else
          record[name] = field

    update {
      _table: 'collections'
      id: collection.id
    }, record, { upsert: true }

  promises.push save_games games
  Promise.all promises

module.exports = {
  store
  save_download_keys
  save_users
  save_games
  save_collections
  insert
  update
  find
  findOne
}

