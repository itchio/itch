
import test from 'zopf'
import proxyquire from 'proxyquire'

import sd from './skin-deeper'
import stubs from '../stubs/react-stubs'

test('GameCell', t => {
  const GameCell = proxyquire('../../app/components/game-cell', stubs).default
  const game = {
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
  const install = {}

  sd.shallowRender(sd(GameCell, {game, install}))
  install.progress = 0.2

  ;['download', 'extract', 'idle', 'error', 'launch'].forEach((task) => {
    install.task = task
    sd.shallowRender(sd(GameCell, {game, install}))
  })
})
