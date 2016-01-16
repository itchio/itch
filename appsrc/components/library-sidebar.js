
let r = require('r-dom')
let mori = require('mori')
let _ = require('underscore')
let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let Icon = require('./icon')
let TaskIcon = require('./task-icon')
let UserPanel = require('./user-panel')
let LibraryPanelLink = require('./library-panel-link')

// Hack for frameless styling
let frameless = process.platform === 'darwin'

let is_cave_interesting = (panel, kv) => {
  let id = mori.first(kv)
  let cave = mori.last(kv)

  if (mori.get(cave, 'progress') > 0) {
    return true
  }

  if (panel === `caves/${id}`) {
    return true
  }

  return false
}

/**
 * A list of tabs, collections and caved games
 * TODO: this component does too much, split it!
 */
class LibrarySidebar extends ShallowComponent {
  render () {
    let t = this.t
    let global_state = this.props.state
    let state = mori.get(global_state, 'library')
    let panel = mori.get(state, 'panel')
    let caves = mori.get(state, 'caves')
    let collections = mori.get(state, 'collections')
    let games = mori.get(state, 'games')

    let is_developer = false
    let credentials = mori.get(global_state, 'credentials')
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
        label: t('sidebar.getting_started'),
        before: r(Icon, {icon}),
        panel,
        key: 'empty'
      })
    }

    own_collections = own_collections.map((props) => r(LibraryPanelLink, props))
    ftd_collections = ftd_collections.map((props) => r(LibraryPanelLink, props))

    let installed_count = mori.count(caves)

    let in_progress_items = mori.filter(_.partial(is_cave_interesting, panel), caves)
    let cave_items = mori.map((kv) => {
      let id = mori.first(kv)
      let cave = mori.last(kv)
      let task = mori.get(cave, 'task')
      let error = mori.get(cave, 'error')
      let path = `caves/${id}`

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
      return r(LibraryPanelLink, props)
    }, in_progress_items)

    let links = []

    if (is_developer) {
      let dashboard_link = r(LibraryPanelLink, {
        before: r(Icon, {icon: 'rocket'}),
        name: 'dashboard',
        label: t('sidebar.dashboard'),
        panel, games, className: 'dashboard'
      })
      links.push(dashboard_link)
    }

    links.push(r(LibraryPanelLink, {
      before: r(Icon, {icon: 'heart-filled'}),
      name: 'owned',
      label: t('sidebar.owned'),
      panel, games, className: 'owned'
    }))

    links.push(r(LibraryPanelLink, {
      before: r(Icon, {icon: 'checkmark'}),
      name: 'caved',
      label: t('sidebar.installed'),
      panel, games, className: 'installed',
      count: installed_count
    }))

    if (panel === 'preferences') {
      links.push(r(LibraryPanelLink, {
        before: r(Icon, {icon: 'cog'}),
        name: 'preferences',
        label: t('menu.file.preferences'),
        panel, games
      }))
    }

    {
      let loc_matches = panel.match(/^locations\/(.*)$/)
      if (loc_matches) {
        let loc_name = loc_matches[1]
        let loc = mori.getIn(global_state, ['install-locations', 'locations', loc_name])
        let path = mori.get(loc, 'path')

        let aliases = mori.toJs(mori.getIn(global_state, ['install-locations', 'aliases']))
        for (let alias of aliases) {
          path = path.replace(alias[0], alias[1])
        }

        let link = r(LibraryPanelLink, {before: r(Icon, {icon: 'folder'}), name: panel, label: path, panel, games})
        links.push(link)
      }
    }

    links.push(r.div({className: 'separator'}))

    links = links.concat(own_collections)
    links = links.concat(ftd_collections)

    let num_cave_items = mori.count(cave_items)
    if (num_cave_items > 0) {
      links.push(r.div({className: 'separator'}))
      links = links.concat(mori.intoArray(cave_items))
    }

    return (
      r.div({classSet: {sidebar: true, frameless}}, [
        r(UserPanel, {state: global_state}),
        r.div({className: 'panel_links'}, links)
      ])
    )
  }
}

LibrarySidebar.propTypes = {
  state: PropTypes.any
}

module.exports = LibrarySidebar
