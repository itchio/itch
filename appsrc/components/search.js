
let r = require('r-dom')
import {getIn, get, count, merge} from 'mori-ext'

let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let Icon = require('./icon')
let GameList = require('./game-list')

let AppActions = require('../actions/app-actions')
let AppDispatcher = require('../dispatcher/app-dispatcher')

let AppConstants = require('../constants/app-constants')
let SearchExamples = require('../constants/search-examples')

class SearchContent extends ShallowComponent {
  onInput (event) {
    let query = event.target.value
    AppActions.search_query_change(query)
    AppActions.fetch_search(query)
  }

  componentDidMount () {
    AppDispatcher.register('search-bar', (payload) => {
      if (payload.action_type === AppConstants.LIBRARY_FOCUS_PANEL && payload.panel === 'search') {
        this.focus()
      }
    })

    this.focus()
  }

  componentWillUnmount () {
    AppDispatcher.unregister('search-bar')
  }

  focus () {
    this.refs.input.focus()
    this.refs.input.select()
  }

  render () {
    let t = this.t
    let state = this.props.state::get('library')
    let caves = state::get('caves')

    let games = state::get('games')
    let owned_games_by_id = games::get('dashboard')::merge(games::get('owned'))
    let query = state::getIn(['search', 'query']) || ''
    let fetched_query = state::getIn(['search', 'fetched_query'])
    let search_games = state::getIn(['search', 'games'])
    let loading = query !== fetched_query
    let empty = search_games::count() === 0
    let is_press = this.state::getIn(['credentials', 'me', 'press_user'])

    let searchbox_children = [
      r(Icon, {icon: 'search', spin: (query.length > 0 && loading)}),
      r.input({ref: 'input', type: 'text', value: query, placeholder: t('search.placeholder'), onChange: this.onInput.bind(this)})
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
  constructor () {
    super()
    this.state = {
      example_index: Math.floor(Math.random() * (SearchExamples.length - 1))
    }
  }

  render () {
    let t = this.t
    let query = this.props.query
    let fetched_query = this.props.fetched_query

    let message = t(this.message_key(query, fetched_query))
    return r.div({className: 'search_content empty_search_content'}, r.div({}, message))
  }

  message_key (query, fetched_query) {
    let t = this.t
    if (query.length === 0) {
      console.log(`example index = ${this.state.example_index}`)
      let example = SearchExamples[this.state.example_index]
      return t('search.empty.tagline', {example})
    } else if (query === fetched_query) {
      return t('search.empty.no_results')
    } else {
      return ''
    }
  }

  pick_example () {

  }
}

EmptySearchContent.propTypes = {
  query: PropTypes.any,
  fetched_query: PropTypes.any
}

module.exports = SearchContent
