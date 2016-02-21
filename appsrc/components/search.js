
let r = require('r-dom')
import {getIn, get, count, merge} from 'mori-ext'

let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let Icon = require('./icon')
let GameList = require('./game-list')
let AppActions = require('../actions/app-actions')

class SearchContent extends ShallowComponent {
  onInput (event) {
    let query = event.target.value
    AppActions.search_query_change(query)
    AppActions.fetch_search(query)
  }
  render () {
    let t = this.t
    let state = this.props.state::get('library')
    let caves = state::get('caves')

    let games = state::get('games')
    let owned_games_by_id = games::get('dashboard')::merge(games::get('owned'))
    let query = state::getIn(['search', 'query'])
    let fetched_query = state::getIn(['search', 'fetched_query'])
    let search_games = state::getIn(['search', 'games'])
    let loading = query !== fetched_query
    let empty = search_games::count() === 0
    let is_press = this.state::getIn(['credentials', 'me', 'press_user'])

    let searchbox_children = [
      r(Icon, {icon: 'search', spin: (query.length > 0 && loading)}),
      r.input({type: 'text', value: query, placeholder: t('search.placeholder'), onChange: this.onInput.bind(this)})
    ]

    return r.div({className: 'search_container'}, [
      r.div({className: 'search_header'}, [
        r.div({className: 'searchbox'}, searchbox_children)
      ]),
      r.div({className: 'search_content'}, [
        empty
        ? r(EmptySearchContent, {fetched_query, query})
        : r(GameList, {games: search_games, caves, owned_games_by_id, is_press})
      ])
    ])
  }
}

SearchContent.propTypes = {
  state: PropTypes.any
}

class EmptySearchContent extends ShallowComponent {
  render () {
    let t = this.t
    let query = this.props.query
    let fetched_query = this.props.fetched_query

    let message = t(this.message_key(query, fetched_query))
    return r.div({className: 'search_content empty_search_content'}, r.div({}, message))
  }

  message_key (query, fetched_query) {
    if (query.length === 0) {
      return 'search.empty.tagline'
    } else if (query === fetched_query) {
      return 'search.empty.no_results'
    } else {
      return 'search.empty.loading'
    }
  }
}

EmptySearchContent.propTypes = {
  query: PropTypes.any,
  fetched_query: PropTypes.any
}

module.exports = SearchContent
