import test from 'zopf'
import mori from 'mori'
import proxyquire from 'proxyquire'
import sd from 'skin-deep'

import electron from '../stubs/electron'

let $ = require('react').createElement

test('game-list', t => {
  let {GameCell, GameList} = proxyquire('../../app/components/game-list', electron)

  t.case('GameList', t => {
    sd.shallowRender($(GameList, {}))
    let games = mori.toClj([{id: 12}, {id: 26}, {id: 42}])
    let installs = mori.toClj({
      'asd09f8': {game_id: 42}
    })
    sd.shallowRender($(GameList, {games, installs}))
  })

  t.case('GameCell', t => {
    let game = mori.toClj({
      title: 'a',
      cover_url: 'b',
      user: {
        display_name: 'd'
      }
    })
    let install = null

    sd.shallowRender($(GameCell, {game, install}))
    install = mori.assoc(install, 'progress', 0.2)

    ;['download', 'extract', 'idle', 'error', 'launch'].forEach((task) => {
      install = mori.assoc(install, 'task', task)
      sd.shallowRender($(GameCell, {game, install}))
    })
  })
})
