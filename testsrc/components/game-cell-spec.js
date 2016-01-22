
let test = require('zopf')
let mori = require('mori')
let proxyquire = require('proxyquire')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

test('GameCell', t => {
  let GameCell = proxyquire('../../app/components/game-cell', stubs)
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
