
let r = require('r-dom')
import {partial} from 'underline'
import {first, last, each, get, getIn, map, filter, count, sortBy, groupBy, intoArray} from 'mori-ext'

let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let Icon = require('./icon')
let TaskIcon = require('./task-icon')
let UserPanel = require('./user-panel')
let LibraryPanelLink = require('./library-panel-link')

// Hack for frameless styling
let frameless = process.platform === 'darwin'

let is_cave_interesting = (panel, kv) => {
  let id = kv::first()
  let cave = kv::last()

  if (cave::get('progress') > 0) {
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
    let state = global_state::get('library')

    let panel = state::get('panel')
    let caves = state::get('caves')
    let collections = state::get('collections')
    let games = state::get('games')

    let is_developer = false
    let credentials = global_state::get('credentials')
    if (credentials) {
      is_developer = credentials::getIn(['me', 'developer'])
    }

    let collection_items = ((pair) => {
      let id = pair::first()
      let collection = pair::last()
      let featured = collection::get('_featured')
      let icon = 'tag'
      if (featured) {
        icon = 'star'
      }

      return {
        icon,
        games,
        name: `collections/${id}`,
        className: `collection`,
        label: collection::get('title'),
        before: r(Icon, {icon}),
        panel,
        key: id
      }
    })::map(collections)

    let colls_by_decreasing_num_items = collection_items::sortBy((x) => -games::get(x.name)::count())
    let grouped_colls = colls_by_decreasing_num_items::groupBy((x) => x.icon)

    let own_collections = grouped_colls::get('tag')::intoArray()
    let ftd_collections = grouped_colls::get('star')::intoArray()

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

    let installed_count = caves::count()

    let in_progress_items = caves::filter(is_cave_interesting::partial(panel))

    let cave_items = ((kv) => {
      let id = kv::first()
      let cave = kv::last()
      let task = cave::get('task')
      let error = cave::get('error')
      let path = `caves/${id}`

      let props = {
        games: {}, // don't display number bullet
        name: path,
        label: cave::getIn(['game', 'title']),
        error: task === 'error' && error,
        progress: cave::get('progress'),
        before: r(TaskIcon, {task}),
        panel,
        key: id
      }
      return r(LibraryPanelLink, props)
    })::map(in_progress_items)

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
        let loc = global_state::getIn(['install-locations', 'locations', loc_name])
        let path = loc::get('path')

        // XXX perf: can definitely be handled store-side
        ;((alias) => {
          path = path.replace(alias::first(), alias::last())
        })::each(global_state::getIn(['install-locations', 'aliases']))

        let link = r(LibraryPanelLink, {before: r(Icon, {icon: 'folder'}), name: panel, label: path, panel, games})
        links.push(link)
      }
    }

    links.push(r.div({className: 'separator'}))

    links = links.concat(own_collections)
    links = links.concat(ftd_collections)

    let num_cave_items = cave_items::count()
    if (num_cave_items > 0) {
      links.push(r.div({className: 'separator'}))
      links = links.concat(cave_items::intoArray())
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
