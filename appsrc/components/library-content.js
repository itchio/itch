
import r from 'r-dom'
import { getIn, count } from 'grovel'
import {each} from 'underline'

import {PropTypes} from 'react'
import ShallowComponent from './shallow-component'

import GameList from './game-list'
import LibraryPlaceholder from './library-placeholder'
import PreferencesForm from './preferences-form'
import SearchContent from './search'

// predicates
const pred_every = (cave) => true

/**
 * A list of games corresponding to whatever library tab is selected
 */
class LibraryContent extends ShallowComponent {
  render () {
    const {state} = this.props
    const panel = state::getIn(['library', 'panel'])
    // PSA: the app is open-source, but remember that the server has to agree with you
    const is_press = state::getIn(['credentials', 'me', 'press_user'])

    const children = []
    const sort = !(/^collections/.test(panel))

    if (panel === 'preferences') {
      children.push(r(PreferencesForm, {state}))
    } else if (/^search/.test(panel)) {
      children.push(r(SearchContent, {state}))
    } else {
      const caves = state::getIn(['library', 'caves'])
      const games = state::getIn(['library', 'games'])

      const shown_games = games::getIn([panel]) || {}
      let pred = pred_every

      {
        const loc_matches = panel.match(/^locations\/(.*)$/)
        if (loc_matches) {
          const loc_name_filter = loc_matches[1]
          pred = (cave) => {
            const loc_name = cave.install_location || 'appdata'
            return (loc_name_filter === loc_name)
          }
        }
      }

      // XXX: dedup with search
      const owned_games_by_id = {}
      games::getIn(['dashboard'])::each((g) => owned_games_by_id[g.id] = true)
      games::getIn(['owned'])::each((g) => owned_games_by_id[g.id] = true)

      if (shown_games::count() > 0) {
        children.push(r(GameList, {games: shown_games, caves, pred, owned_games_by_id, is_press, sort}))
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

export default LibraryContent
