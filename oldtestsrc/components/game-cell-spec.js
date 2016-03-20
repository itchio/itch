
import test from 'zopf'
import sd from './skin-deeper'

import GameCell from '../../app/components/game-cell'

test('GameCell', t => {
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
