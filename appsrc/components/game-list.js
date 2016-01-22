
let r = require('r-dom')
let mori = require('mori')
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
    let pred = this.props.pred || always_true
    let games = this.props.games
    let caves = this.props.caves
    let owned_games_by_id = this.props.owned_games_by_id
    let is_press = this.props.is_press

    let index_by = (acc, k, v) => mori.assoc(acc, mori.get(v, 'game_id'), v)
    // TODO perf: app-store should maintain this instead of us recomputing it
    // every time GameList is dirty
    let caves_by_game_id = mori.reduceKV(index_by, mori.hashMap(), caves)

    let children = []

    // TODO perf: game-list should only filter & pass down immutable
    // substructures, and let owned computation to children so that we
    // take advantage of dirty checking
    mori.each(mori.vals(games), (game) => {
      let game_id = mori.get(game, 'id')
      let cave = mori.get(caves_by_game_id, game_id)
      if (!pred(cave)) return

      let owned_via_library = mori.hasKey(owned_games_by_id, game_id.toString())
      let owned_via_press_system = !!(is_press && mori.get(game, 'in_press_system'))
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
