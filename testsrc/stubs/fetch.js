
import test from 'zopf'

const self = {
  dashboard_games: (market, cb) => cb(),
  owned_keys: (market, cb) => cb(),
  collections: (market, fid, cb) => cb(),
  collection_games: (market, cid, cb) => cb(),
  search: async (q) => {}
}

module.exports = test.module(self)
