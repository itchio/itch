
let test = require('zopf')
let mori = require('mori')
let proxyquire = require('proxyquire')
import {indexBy} from 'underline'

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

let cellprops = (tree, f) => sd.as_array(tree.findNode('.game_list').props.children).map(f)

test('GameList', t => {
  let GameList = proxyquire('../../app/components/game-list', stubs)

  t.case('empty', t => {
    sd.shallowRender(sd(GameList, {}))
  })

  t.case('predicate-based filtering', t => {
    let games = mori.toClj([{id: 12}, {id: 26, in_press_system: true}, {id: 42}]::indexBy('id'))
    let caves = mori.toClj({
      'asd09f8': {game: 42}
    })

    let tree = sd.shallowRender(sd(GameList, {games, caves}))
    t.same(['12', '26', '42'], cellprops(tree, (x) => x.key), 'shows all games')

    let pred = (cave) => cave != null
    tree = sd.shallowRender(sd(GameList, {games, caves, pred}))
    t.same(['42'], cellprops(tree, (x) => x.key), 'shows only games with caves')

    let owned_games_by_id = mori.hashMap('12', true)

    tree = sd.shallowRender(sd(GameList, {games, caves, owned_games_by_id}))
    t.same([true, false, false], cellprops(tree, (x) => x.props.owned), 'marks as owned when library')

    tree = sd.shallowRender(sd(GameList, {games, caves, owned_games_by_id, is_press: true}))
    t.same([true, true, false], cellprops(tree, (x) => x.props.owned), 'marks as owned when press')
  })
})
