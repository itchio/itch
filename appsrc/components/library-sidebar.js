
let r = require('r-dom')
import { count, getIn } from 'grovel'
import { map, partial, groupBy, sortBy, filter, each } from 'underline'

let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let Icon = require('./icon')
let TaskIcon = require('./task-icon')
let UserPanel = require('./user-panel')
let LibraryPanelLink = require('./library-panel-link')

// Hack for frameless styling
let frameless = process.platform === 'darwin'

let is_cave_interesting = (panel, cave) => {
  if (cave.progress > 0) {
    return true
  }

  if (panel === `caves/${cave.id}`) {
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
    let {state} = this.props

    let {panel, caves = {}, collections = {}, games = {}} = state.library
    let is_developer = state::getIn(['credentials', 'me', 'developer'])

    let collection_items = collections::map((collection) => {
      let featured = collection._featured
      let icon = 'tag'
      if (featured) {
        icon = 'star'
      }

      return {
        icon,
        games,
        name: `collections/${collection.id}`,
        className: `collection`,
        label: collection.title,
        before: r(Icon, {icon}),
        panel,
        key: collection.id
      }
    })

    let decreasing_count = (x) => -games[x.name]::count()
    let grouped_colls = collection_items::groupBy((x) => x.icon)

    let own_collections = grouped_colls.tag::sortBy(decreasing_count)
    let ftd_collections = grouped_colls.star::sortBy(decreasing_count)

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

    let installed_count = caves.length
    let search_count = games.search::count()

    let in_progress_items = caves::filter(is_cave_interesting::partial(panel))

    let cave_items = ((cave) => {
      let task = cave.task
      let error = cave.error
      let path = `caves/${cave.id}`
      let cave_game = games::getIn(['caved', cave.game_id])

      let props = {
        games: {}, // don't display number bullet
        name: path,
        label: cave_game.title,
        error: task === 'error' && error,
        progress: cave.progress,
        before: r(TaskIcon, {task}),
        panel,
        key: cave.id
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

    links.push(r(LibraryPanelLink, {
      before: r(Icon, {icon: 'search'}),
      name: 'search',
      label: t('sidebar.search'),
      panel, games, className: 'search',
      count: panel === 'search' && search_count
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
        let loc = state.install_locations.locations[loc_name]
        let path = loc.path

        // XXX perf: can definitely be handled store-side
        state.install_locations.aliases::each((short, long) => {
          path = path.replace(long, short)
        })

        let link = r(LibraryPanelLink, {before: r(Icon, {icon: 'folder'}), name: panel, label: path, panel, games})
        links.push(link)
      }
    }

    links.push(r.div({className: 'separator'}))

    links = links.concat(own_collections)
    links = links.concat(ftd_collections)

    let num_cave_items = cave_items.length
    if (num_cave_items > 0) {
      links.push(r.div({className: 'separator'}))
      links = links.concat(cave_items)
    }

    return (
      r.div({classSet: {sidebar: true, frameless}}, [
        r(UserPanel, {state}),
        r.div({className: 'panel_links'}, links)
      ])
    )
  }
}

LibrarySidebar.propTypes = {
  state: PropTypes.any
}

module.exports = LibrarySidebar
