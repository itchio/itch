
let r = require('r-dom')
let mori = require('mori')
let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let GameList = require('./game-list')
let LibraryPlaceholder = require('./library-placeholder')
let PreferencesForm = require('./preferences-form')

// predicates
let pred_every = (cave) => true
let pred_caved = (cave) => mori.get(cave, 'task') !== 'error'
let pred_broken = (cave) => mori.get(cave, 'task') === 'error'

/**
 * A list of games corresponding to whatever library tab is selected
 */
class LibraryContent extends ShallowComponent {
  render () {
    let state = this.props.state
    let panel = mori.getIn(state, ['library', 'panel'])
    // PSA: the app is open-source, but remember that the server has to agree with you
    let is_press = mori.getIn(state, ['credentials', 'me', 'press_user'])

    let children = []

    if (panel === 'preferences') {
      children.push(r(PreferencesForm, {state}))
    } else {
      let caves = mori.getIn(state, ['library', 'caves'])
      let games = mori.getIn(state, ['library', 'games'])

      let bucket = panel
      if (/^(locations|broken)/.test(panel)) {
        bucket = 'caved'
      }
      let shown_games = mori.get(games, bucket) || mori.list()

      let pred = pred_every
      if (panel === 'caved') {
        pred = pred_caved
      }
      if (panel === 'broken') {
        pred = pred_broken
      }

      {
        let loc_matches = panel.match(/^locations\/(.*)$/)
        if (loc_matches) {
          let loc_name_filter = loc_matches[1]
          pred = (cave) => {
            let loc_name = mori.get(cave, 'install_location') || 'appdata'
            return (loc_name_filter === loc_name)
          }
        }
      }

      let owned_games_by_id = mori.merge(mori.get(games, 'dashboard'), mori.get(games, 'owned'))

      if (mori.count(shown_games) > 0) {
        children.push(r(GameList, {games: shown_games, caves, pred, owned_games_by_id, is_press}))
      } else {
        children.push(r(LibraryPlaceholder, {panel}))
      }
    }

    return r.div({className: 'main_content'}, children)
  }
}

LibraryContent.propTypes = {
  state: PropTypes.any
}

module.exports = LibraryContent
