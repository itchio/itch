
import {each, indexBy} from 'underline'

import r from 'r-dom'
import {PropTypes} from 'react'

import ShallowComponent from './shallow-component'
import GameCell from './game-cell'

// can't write that as an inline expression (babel goes crazy)
const always_true = () => true

/**
 * A bunch of games, as a grid
 */
class GameList extends ShallowComponent {
  render () {
    const {games = {}, caves = {}, owned_games_by_id = {}, is_press} = this.props
    const pred = this.props.pred || always_true

    // TODO perf: app-store should maintain this instead of us recomputing it
    // every time GameList is dirty
    const caves_by_game = caves::indexBy('game_id')

    const children = []

    // TODO perf: game-list should only filter & pass down immutable
    // substructures, and let owned computation to children so that we
    // take advantage of dirty checking
    games::each((game) => {
      let cave = caves_by_game[game.id]
      if (!pred(cave)) return

      const owned_via_library = owned_games_by_id[game.id]
      const owned_via_press_system = !!(is_press && game.in_press_system)
      const owned = owned_via_library || owned_via_press_system

      children.push(
        r(GameCell, {key: game.id, game, cave, owned})
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

export default GameList
