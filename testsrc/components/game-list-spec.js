
import test from 'zopf'
import sd from './skin-deeper'
import { indexBy } from 'underline'

import GameList from '../../app/components/game-list'

let cellprops = (tree, f) => sd.as_array(tree.findNode('.game_list').props.children).map(f)

test('GameList', t => {
  t.case('empty', t => {
    sd.shallowRender(sd(GameList, {}))
  })

  t.case('predicate-based filtering', t => {
    const games = [{id: 12}, {id: 26, in_press_system: true}, {id: 42}]::indexBy('id')
    const caves = {
      'asd09f8': {game_id: 42}
    }

    let tree = sd.shallowRender(sd(GameList, {games, caves}))
    t.same(['12', '26', '42'], cellprops(tree, (x) => x.key), 'shows all games')

    const pred = (cave) => cave != null
    tree = sd.shallowRender(sd(GameList, {games, caves, pred}))
    t.same(['42'], cellprops(tree, (x) => x.key), 'shows only games with caves')

    const owned_games_by_id = {'12': true}

    tree = sd.shallowRender(sd(GameList, {games, caves, owned_games_by_id}))
    t.same([true, false, false], cellprops(tree, (x) => x.props.owned), 'marks as owned when library')

    tree = sd.shallowRender(sd(GameList, {games, caves, owned_games_by_id, is_press: true}))
    t.same([true, true, false], cellprops(tree, (x) => x.props.owned), 'marks as owned when press')
  })
})
