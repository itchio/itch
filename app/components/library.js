'use strict'

let r = require('r-dom')
let mori = require('mori')
let PropTypes = require('react').PropTypes
let Component = require('./component')

let UserPanel = require('./user-panel').UserPanel
let GameList = require('./game-list').GameList
let misc = require('./misc')
let Icon = misc.Icon
let TaskIcon = misc.TaskIcon
let ErrorList = misc.ErrorList
let ProgressBar = misc.ProgressBar

let AppActions = require('../actions/app-actions')

// Hack for frameless styling
let frameless = process.platform === 'darwin'

/**
 * The main state of the client - displaying the library
 */
class LibraryPage extends Component {
  render () {
    let state = this.props.state
    let update = this.props.update

    return r.div({className: 'library_page'}, [
      r(StatusBar, {update}),
      r(LibrarySidebar, {state}),
      r(LibraryContent, {state})
    ])
  }
}

LibraryPage.propTypes = {
  state: PropTypes.any
}

class StatusBar extends Component {
  render () {
    let update = this.props.update
    let error = mori.get(update, 'error')
    let available = mori.get(update, 'available')
    let downloaded = mori.get(update, 'downloaded')
    let checking = mori.get(update, 'checking')
    let uptodate = mori.get(update, 'uptodate')

    let children = []
    let active = true

    let onClick = () => null

    if (error) {
      onClick = AppActions.dismiss_update_error
      console.log('error', error)
      children = [
        r(misc.Icon, {icon: 'neutral'}),
        r.span('Error while checking for update: ' + error),
        r(misc.Icon, {icon: 'cross'})
      ]
    } else if (downloaded) {
      onClick = AppActions.apply_self_update
      children = [
        r(misc.Icon, {icon: 'install'}),
        r.span('Click to restart & apply update!')
      ]
    } else if (available) {
      children = [
        r(misc.Icon, {icon: 'download'}),
        r.span('Downloading update...')
      ]
    } else if (checking) {
      children = [
        r(misc.Icon, {icon: 'stopwatch'}),
        r.span('Looking for updates...')
      ]
    } else if (uptodate) {
      children = [
        r(misc.Icon, {icon: 'like'}),
        r.span('Your itch is up-to-date!')
      ]
    } else {
      active = false
    }

    return (
      r.div({classSet: {status_bar: true, active}},
        r.div({className: 'message', onClick}, children)
      )
    )
  }
}

/**
 * A list of tabs, collections and caved games
 * TODO: this component does too much, split it!
 */
class LibrarySidebar extends Component {
  render () {
    let state = this.props.state
    let panel = mori.get(state, 'panel')
    let caves = mori.get(state, 'caves')
    let collections = mori.get(state, 'collections')
    let games = mori.get(state, 'games')

    let is_developer = false
    let credentials = mori.get(state, 'credentials')
    if (credentials) {
      is_developer = mori.getIn(credentials, ['me', 'developer'])
    }

    let collection_items = mori.reduceKV((acc, id, collection) => {
      let props = {
        games,
        name: `collections/${id}`,
        label: mori.get(collection, 'title'),
        before: r(Icon, {icon: 'tag'}),
        panel,
        key: id
      }
      acc.push(r(LibraryPanelLink, props))
      return acc
    }, [], collections)

    let cave_items = mori.reduceKV((acc, id, cave) => {
      let progress = mori.get(cave, 'progress')
      let task = mori.get(cave, 'task')
      let error = mori.get(cave, 'error')

      if (!(progress > 0 || task === 'error')) {
        return acc
      }

      let props = {
        games: {}, // don't display number bullet
        name: `caves/${id}`,
        label: mori.getIn(cave, ['game', 'title']),
        error: task === 'error' && error,
        progress: mori.get(cave, 'progress'),
        before: r(TaskIcon, {task}),
        panel,
        key: id
      }
      acc.push(r(LibraryPanelLink, props))
      return acc
    }, [], caves)

    return (
      r.div({classSet: {sidebar: true, frameless}}, [
        r(UserPanel),
        r.div({className: 'panel_links'}, [
          r(LibraryPanelLink, {before: r(Icon, {icon: 'heart-filled'}), name: 'owned', label: 'Owned', panel, games}),
          r(LibraryPanelLink, {before: r(Icon, {icon: 'checkmark'}), name: 'caved', label: 'Installed', panel, games}),
          (is_developer
          ? r(LibraryPanelLink, {before: r(Icon, {icon: 'rocket'}), name: 'dashboard', label: 'Dashboard', panel, games})
          : ''),
          r.div({className: 'separator'})
        ].concat(mori.intoArray(collection_items)).concat([
          mori.count(cave_items) > 0
          ? r.div({}, [
            r.div({className: 'separator'})
          ].concat(mori.intoArray(cave_items)))
          : ''
        ]))
      ])
    )
  }
}

LibrarySidebar.propTypes = {
  state: PropTypes.any
}

/**
 * A list of games corresponding to whatever library tab is selected
 */
class LibraryContent extends Component {
  render () {
    let state = this.props.state
    let panel = mori.get(state, 'panel')
    let caves = mori.get(state, 'caves')
    let games = mori.get(state, 'games')

    let shown_games = mori.get(games, panel) || mori.list()

    return (
      r.div({className: 'main_content'}, [
        r(GameList, {games: shown_games, caves})
      ])
    )
  }
}

LibraryContent.propTypes = {
  state: PropTypes.any
}

/**
 * A sidebar link to one of the library's panels. Could
 * be a link to a tab, or to a specific collection or cave.
 */
class LibraryPanelLink extends Component {
  render () {
    let name = this.props.name
    let panel = this.props.panel
    let label = this.props.label
    let progress = this.props.progress
    let before = this.props.before || ''
    let error = this.props.error
    let games = this.props.games || {}

    let relevant_games = mori.get(games, name) || mori.list()
    let game_count = mori.count(relevant_games)
    let current = (name === panel)

    let _progress = progress ? ` (${(progress * 100).toFixed()}%)` : ''
    let _label = `${label}${_progress}`

    return (
      r.div({classSet: {panel_link: true, current}, onClick: () => AppActions.focus_panel(this.props.name)}, [
        before,
        _label,
        (game_count > 0
        ? r.span({className: 'bubble'}, game_count)
        : ''),
        r(ProgressBar, {progress}),
        r(ErrorList, {errors: error})
      ])
    )
  }
}

LibraryPanelLink.propTypes = {
  name: PropTypes.string,
  panel: PropTypes.string,
  label: PropTypes.string,
  progress: PropTypes.number,
  error: PropTypes.any,
  games: PropTypes.object,
  before: PropTypes.any
}

module.exports = {LibraryPage, LibrarySidebar, LibraryContent, LibraryPanelLink}
