
const test = require('zopf')
const proxyquire = require('proxyquire')

const sd = require('./skin-deeper')
const stubs = require('../stubs/react-stubs')

test('GameCell', t => {
  let GameCell = proxyquire('../../app/components/game-cell', stubs)
  let game = {
    title: 'a',
    cover_url: 'b',
    user: {
      display_name: 'd'
    },
    p_android: true,
    p_windows: true,
    p_linux: true,
    p_osx: true
  }
  let install = {}

  sd.shallowRender(sd(GameCell, {game, install}))
  install.progress = 0.2

  ;['download', 'extract', 'idle', 'error', 'launch'].forEach((task) => {
    install.task = task
    sd.shallowRender(sd(GameCell, {game, install}))
  })
})
