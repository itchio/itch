
let r = require('r-dom')
import {getIn, get, merge, count} from 'mori-ext'

let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let GameList = require('./game-list')
let LibraryPlaceholder = require('./library-placeholder')
let PreferencesForm = require('./preferences-form')

// predicates
let pred_every = (cave) => true

/**
 * A list of games corresponding to whatever library tab is selected
 */
class LibraryContent extends ShallowComponent {
  render () {
    let state = this.props.state
    let panel = state::getIn(['library', 'panel'])
    // PSA: the app is open-source, but remember that the server has to agree with you
    let is_press = state::getIn(['credentials', 'me', 'press_user'])

    let children = []

    if (panel === 'preferences') {
      children.push(r(PreferencesForm, {state}))
    } else {
      let caves = state::getIn(['library', 'caves'])
      let games = state::getIn(['library', 'games'])

      let bucket = panel
      if (/^(locations|broken)/.test(panel)) {
        bucket = 'caved'
      }
      let shown_games = games::get(bucket)

      let pred = pred_every

      {
        let loc_matches = panel.match(/^locations\/(.*)$/)
        if (loc_matches) {
          let loc_name_filter = loc_matches[1]
          pred = (cave) => {
            let loc_name = cave::get('install_location') || 'appdata'
            return (loc_name_filter === loc_name)
          }
        }
      }

      let owned_games_by_id = games::get('dashboard')::merge(games::get('owned'))

      if (shown_games::count() > 0) {
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
