
let fetch = {
  dashboard_games: (market, cb) => cb(),
  owned_keys: (market, cb) => cb(),
  collections: (market, fid, cb) => cb(),
  collection_games: (market, cid, cb) => cb(),
  search: (market, q, cb) => cb(),

  '@noCallThru': true
}

module.exports = fetch
