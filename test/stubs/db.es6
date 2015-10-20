import Promise from 'bluebird'

let noop = () => Promise.resolve()

let self = {
  insert: noop,
  update: noop,
  find_one: noop,
  find: noop,
  load: noop,
  save_records: noop,
  save_download_keys: noop,
  save_users: noop,
  save_games: noop,
  save_collections: noop,
  '@noCallThru': true
}

export default self
