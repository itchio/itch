
import {zipmap, hasKey, get, vals, each, map} from 'mori-ext'

let r = require('r-dom')
let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let GameCell = require('./game-cell')

// can't write that as an inline expression (babel goes crazy)
let always_true = () => true

/**
 * A bunch of games, as a grid
 */
class GameList extends ShallowComponent {
  render () {
    let {games, caves, owned_games_by_id, is_press} = this.props
    let pred = this.props.pred || always_true

    // TODO perf: app-store should maintain this instead of us recomputing it
    // every time GameList is dirty
    let caves_by_game_id = ((x) => x::get('game_id'))::map(caves::vals())::zipmap(caves::vals())

    let children = []

    // TODO perf: game-list should only filter & pass down immutable
    // substructures, and let owned computation to children so that we
    // take advantage of dirty checking
    games::vals()::each((game) => {
      let game_id = game::get('id')
      let cave = caves_by_game_id::get(game_id)
      if (!pred(cave)) return

      let owned_via_library = owned_games_by_id::hasKey(game_id.toString())
      let owned_via_press_system = !!(is_press && game::get('in_press_system'))
      let owned = owned_via_library || owned_via_press_system

      children.push(
        r(GameCell, {key: game_id, game, cave, owned})
      )
    })

    return (
      r.div({className: 'game_list'}, children)
    )
  }
}

GameList.propTypes = {
  games: PropTypes.any,
  caves: PropTypes.any
}

module.exports = GameList
