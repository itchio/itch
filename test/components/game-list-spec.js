
let test = require('zopf')
let mori = require('mori')
let proxyquire = require('proxyquire')
let _ = require('underscore')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

test('game-list', t => {
  let gamelist = proxyquire('../../app/components/game-list', stubs)
  let GameCell = gamelist.GameCell
  let GameList = gamelist.GameList

  t.case('GameList', t => {
    sd.shallowRender(sd(GameList, {}))
    let games = mori.toClj(_.indexBy([{id: 12}, {id: 26}, {id: 42}], 'id'))
    let installs = mori.toClj({
      'asd09f8': {game_id: 42}
    })
    sd.shallowRender(sd(GameList, {games, installs}))
  })

  t.case('GameCell', t => {
    let game = mori.toClj({
      title: 'a',
      cover_url: 'b',
      user: {
        display_name: 'd'
      },
      p_android: true,
      p_windows: true,
      p_linux: true,
      p_osx: true
    })
    let install = null

    sd.shallowRender(sd(GameCell, {game, install}))
    install = mori.assoc(install, 'progress', 0.2)

    ;['download', 'extract', 'idle', 'error', 'launch'].forEach((task) => {
      install = mori.assoc(install, 'task', task)
      sd.shallowRender(sd(GameCell, {game, install}))
    })
  })
})
