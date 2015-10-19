import test from 'zopf'
import proxyquire from 'proxyquire'
import sd from 'skin-deep'

import electron from '../stubs/electron'

let $ = require('react').createElement

test('game-list', t => {
  let {GameCell, GameList} = proxyquire('../../app/components/game-list', electron)

  t.case('GameList', t => {
    sd.shallowRender($(GameList, {}))
    let props = {
      games: [{id: 12}, {id: 26}, {id: 42}],
      installs: {
        'asd09f8': {game_id: 42}
      }
    }
    sd.shallowRender($(GameList, props))
  })

  t.case('GameCell', t => {
    let props = {
      game: {
        title: 'a',
        cover_url: 'b',
        user: {
          display_name: 'd'
        }
      },
      install: null
    }

    sd.shallowRender($(GameCell, props))
    props.install = { progress: 0.2 }

    ;['download', 'extract', 'idle', 'error', 'launch'].forEach((task) => {
      props.install.task = task
      sd.shallowRender($(GameCell, props))
    })
  })
})
