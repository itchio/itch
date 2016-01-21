
let test = require('zopf')
let mori = require('mori')
let proxyquire = require('proxyquire')
let _ = require('underscore')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

test('GameList', t => {
  let GameList = proxyquire('../../app/components/game-list', stubs)
  sd.shallowRender(sd(GameList, {}))
  let games = mori.toClj(_.indexBy([{id: 12}, {id: 26}, {id: 42}], 'id'))
  let installs = mori.toClj({
    'asd09f8': {game_id: 42}
  })
  sd.shallowRender(sd(GameList, {games, installs}))
})
