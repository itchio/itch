
let fetch = {
  dashboard_games: cb => cb(),
  owned_keys: (cb) => cb(),
  collections: (fid, cb) => cb(),
  collection_games: (cid, cb) => cb(),
  search: (q, cb) => cb(),

  '@noCallThru': true
}

module.exports = fetch
