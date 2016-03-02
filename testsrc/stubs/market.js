
import test from 'zopf'
const rnil = () => null

const market = {
  get_entities: (table) => ({}),
  save_all_entities: rnil,

  '@noCallThru': true
}

module.exports = test.module(market)
