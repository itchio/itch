
let r = require('r-dom')
let mori = require('mori')
let PropTypes = require('react').PropTypes
let translate = require('react-i18next').translate
let ShallowComponent = require('./shallow-component')

let Icon = require('./icon')
let TaskIcon = require('./task-icon')
let UserPanel = require('./user-panel')
let LibraryPanelLink = require('./library-panel-link')

// Hack for frameless styling
let frameless = process.platform === 'darwin'

/**
 * A list of tabs, collections and caved games
 * TODO: this component does too much, split it!
 */
class LibrarySidebar extends ShallowComponent {
  render () {
    let t = this.props.t
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
          ? r(LibraryPanelLink, {before: r(Icon, {icon: 'rocket'}), name: 'dashboard', label: t('sidebar.dashboard'), panel, games, className: 'dashboard'})
          : ''),
          r(LibraryPanelLink, {before: r(Icon, {icon: 'heart-filled'}), name: 'owned', label: t('sidebar.owned'), panel, games, className: 'owned'}),
          r(LibraryPanelLink, {before: r(Icon, {icon: 'checkmark'}), name: 'caved', label: t('sidebar.installed'), panel, games, count: installed_count, className: 'installed'}),
          r.div({className: 'separator'})
        ].concat(broken_count > 0
          ? [
            r(LibraryPanelLink, {before: r(Icon, {icon: 'heart-broken'}), name: 'broken', label: t('sidebar.broken'), panel, games, count: broken_count, className: 'broken'}),
            r.div({className: 'separator'})
          ]
          : []
        ).concat(own_collections).concat(ftd_collections).concat([
          mori.count(cave_items) > 0
          ? r.div({}, [
            r.div({className: 'separator'})
          ].concat(mori.intoArray(cave_items)))
          : ''
        ]).concat(panel === 'preferences'
        ? r(LibraryPanelLink, {before: r(Icon, {icon: 'cog'}), name: 'preferences', label: t('menu.file.preferences'), panel, games})
        : ''
        ))
      ])
    )
  }
}

LibrarySidebar.propTypes = {
  state: PropTypes.any
}

module.exports = translate('library-sidebar')(LibrarySidebar)
