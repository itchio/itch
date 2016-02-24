
let r = require('r-dom')
import { getIn, count } from 'grovel'
import { each } from 'underline'

let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let GameList = require('./game-list')
let LibraryPlaceholder = require('./library-placeholder')
let PreferencesForm = require('./preferences-form')
let SearchContent = require('./search')

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
    } else if (/^search/.test(panel)) {
      children.push(r(SearchContent, {state}))
    } else {
      let caves = state::getIn(['library', 'caves'])
      let games = state::getIn(['library', 'games'])

      let bucket = panel
      let shown_games = games::getIn([bucket]) || {}

      let pred = pred_every

      {
        let loc_matches = panel.match(/^locations\/(.*)$/)
        if (loc_matches) {
          let loc_name_filter = loc_matches[1]
          pred = (cave) => {
            let loc_name = cave.install_location || 'appdata'
            return (loc_name_filter === loc_name)
          }
        }
      }

      // XXX: dedup with search
      let owned_games_by_id = {}
      games::getIn(['dashboard'])::each((g) => owned_games_by_id[g.id] = true)
      games::getIn(['owned'])::each((g) => owned_games_by_id[g.id] = true)

      if (shown_games::count()) {
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
