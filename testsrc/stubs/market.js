
let rnil = () => null

let market = {
  get_entities: (table) => ({}),
  fetch_dashboard_games: cb => cb(),
  fetch_owned_keys: (cb) => cb(),
  fetch_collections: (fid, cb) => cb(),
  fetch_collection_games: (cid, cb) => cb(),
  fetch_search: (q, cb) => cb(),
  save_all_entities: rnil,

  '@noCallThru': true
}

module.exports = market
