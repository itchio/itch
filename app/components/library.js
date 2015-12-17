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
      children = [
        r(misc.Icon, {icon: 'heart-broken'}),
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
      let featured = mori.get(collection, '_featured')
      let icon = 'tag'
      if (featured) {
        icon = 'star'
      }

      let props = {
        icon,
        games,
        name: `collections/${id}`,
        className: `collection`,
        label: mori.get(collection, 'title'),
        before: r(Icon, {icon}),
        panel,
        key: id
      }
      acc.push(props)
      return acc
    }, [], collections)

    let grouped_colls = mori.groupBy((x) => x.icon,
      mori.sortBy((x) => {
        mori.count(mori.get(games, x.name))
      }, collection_items)
    )

    let own_collections = mori.intoArray(mori.get(grouped_colls, 'tag'))
    let ftd_collections = mori.intoArray(mori.get(grouped_colls, 'star'))

    if (own_collections.length === 0) {
      let icon = 'tag'
      own_collections.push({
        icon,
        games,
        name: `collections/empty`,
        className: `collection`,
        label: `Getting started`,
        before: r(Icon, {icon}),
        panel,
        key: 'empty'
      })
    }

    own_collections = own_collections.map((props) => r(LibraryPanelLink, props))
    ftd_collections = ftd_collections.map((props) => r(LibraryPanelLink, props))

    let installed_count = 0
    let broken_count = 0

    let cave_items = mori.reduceKV((acc, id, cave) => {
      let progress = mori.get(cave, 'progress')
      let task = mori.get(cave, 'task')
      let error = mori.get(cave, 'error')
      let path = `caves/${id}`
      let active = path === panel

      if (task === 'error') {
        broken_count++
        return acc
      } else {
        installed_count++
      }

      if (!(progress > 0 || active)) {
        return acc
      }

      let props = {
        games: {}, // don't display number bullet
        name: path,
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
          (is_developer
          ? r(LibraryPanelLink, {before: r(Icon, {icon: 'rocket'}), name: 'dashboard', label: 'Developed', panel, games, className: 'dashboard'})
          : ''),
          r(LibraryPanelLink, {before: r(Icon, {icon: 'heart-filled'}), name: 'owned', label: 'Owned', panel, games, className: 'owned'}),
          r(LibraryPanelLink, {before: r(Icon, {icon: 'checkmark'}), name: 'caved', label: 'Installed', panel, games, count: installed_count, className: 'installed'}),
          r.div({className: 'separator'})
        ].concat(broken_count > 0
          ? [
              r(LibraryPanelLink, {before: r(Icon, {icon: 'heart-broken'}), name: 'broken', label: 'Broken', panel, games, count: broken_count, className: 'broken'}),
              r.div({className: 'separator'})
            ]
          : []
        ).concat(own_collections).concat(ftd_collections).concat([
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

    let bucket = (panel === 'broken' ? 'caved' : panel)
    let shown_games = mori.get(games, bucket) || mori.list()

    let pred = () => true
    if (panel === 'caved') {
      pred = (cave) => mori.get(cave, 'task') !== 'error'
    }
    if (panel === 'broken') {
      pred = (cave) => mori.get(cave, 'task') === 'error'
    }

    let children = []

    if (mori.count(shown_games) > 0) {
      children.push(r(GameList, {games: shown_games, caves, pred}))
    } else {
      children.push(r(LibraryPlaceholder, {panel}))
    }

    return r.div({className: 'main_content'}, children)
  }
}

LibraryContent.propTypes = {
  state: PropTypes.any
}

class LibraryPlaceholder extends Component {
  render () {
    let panel = this.props.panel

    if (panel === `owned`) {
      return (
        r.div({className: `placeholder`}, [
          r.div({className: 'placeholder_content'}, [
            r.h2({}, 'You made it!'),
            r.p({}, `Things are looking a bit empty right now, but no worries!`),
            r.p({}, `We've put together a few collections so you can start playing right away.`),
            r.p({className: 'hint'}, `Click the labels on your left to navigate around the app`),
          ]),
          r.span({className: 'icon icon-heart-filled placeholder_background'}),
        ])
      )
    } else if (panel === `caved`) {
      return (
        r.div({className: `placeholder`}, [
          r.div({className: 'placeholder_content'}, [
            r.h2({}, 'Your library'),
            r.p({}, `Watch games quietly download, install, and run.`),
            r.p({}, [
              `If something breaks, click `,
              r.a({className: 'fake_button hollow', href: 'https://github.com/itchio/itch/issues'}, [
                r(misc.Icon, {icon: 'heart-broken'})
              ]),
              ` to report it, or `,
              r.a({className: 'fake_button hollow', href: 'https://github.com/itchio/itch/blob/master/docs/diego.md'}, [
                r(misc.Icon, {icon: 'bug'})
              ]),
              ` to investigate.`
            ]),
            r.p({className: 'hint'}, `Keep in mind this is a pre-alpha!`)
          ]),
          r.span({className: 'icon icon-checkmark placeholder_background'})
        ])
      )
    } else if (panel === `dashboard`) {
      return (
        r.div({className: `placeholder`}, [
          r.div({className: 'placeholder_content'}, [
            r.h2({}, 'Welcome home'),
            r.p({}, `We're trying to make it the comfiest.`),
            r.p({}, `Instant set-up, and as few barriers as we can manage.`)
          ]),
          r.span({className: 'icon icon-rocket placeholder_background'}),
          r.a({className: 'fat button', href: 'https://itch.io/developers'}, `Get started`)
        ])
      )
    } else if (/^collections/.test(panel)) {
      return (
        r.div({className: `placeholder`}, [
          r.div({className: 'placeholder_content'}, [
            r.h2({}, 'Mix & match'),
            r.p({}, [
              `Browse the site a little, then use`, r.a({href: 'https://itch.io/my-collections', className: 'fake_button'},
                [r(misc.Icon, {icon: 'plus'}), ` Add to collection`]
              ), ` to start organizing.`]
            ),
            r.p({}, `Your games will be here when you come back.`)
          ]),
          r.span({className: 'icon icon-tag placeholder_background'}),
          r.a({className: 'fat button', href: 'https://itch.io'}, `Let's go shopping`)
        ])
      )
    } else {
      return r.div({}, '')
    }
  }
}

/**
 * A sidebar link to one of the library's panels. Could
 * be a link to a tab, or to a specific collection or cave.
 */
class LibraryPanelLink extends Component {
  render () {
    let className = this.props.className
    let name = this.props.name
    let panel = this.props.panel
    let label = this.props.label
    let progress = this.props.progress
    let before = this.props.before || ''
    let error = this.props.error
    let games = this.props.games || {}

    let count = this.props.count
    if (typeof count === 'undefined') {
      let relevant_games = mori.get(games, name) || mori.list()
      count = mori.count(relevant_games)
    }
    let current = (name === panel)

    let _progress = progress ? ` (${(progress * 100).toFixed()}%)` : ''
    let _label = `${label}${_progress}`

    return (
      r.div({classSet: {panel_link: true, current, [className]: true}, onClick: () => AppActions.focus_panel(this.props.name)}, [
        before,
        _label,
        (count > 0
        ? r.span({className: 'bubble'}, count)
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
