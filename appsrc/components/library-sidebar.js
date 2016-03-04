
import r from 'r-dom'
import {count, getIn} from 'grovel'
import {map, partial, groupBy, sortBy, indexBy, filter, each} from 'underline'

import {PropTypes} from 'react'
import ShallowComponent from './shallow-component'

import Icon from './icon'
import TaskIcon from './task-icon'
import UserPanel from './user-panel'
import LibraryPanelLink from './library-panel-link'

// Hack for frameless styling
const frameless = process.platform === 'darwin'

const is_cave_interesting = (panel, cave) => {
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
    const t = this.t
    const {state} = this.props

    const {panel, caves = {}, collections = {}, games = {}} = state.library
    const is_developer = state::getIn(['credentials', 'me', 'developer'])
    const featured_collection_ids_map = state::getIn(['collections', 'featured_ids'])::indexBy((x) => x)

    const collection_items = collections::map((collection) => {
      const featured = featured_collection_ids_map[collection.id]
      const icon = featured ? 'star' : 'tag'

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

    const decreasing_count = (x) => -games[x.name]::count()
    const grouped_colls = collection_items::groupBy((x) => x.icon)

    const own_collections = grouped_colls.tag::sortBy(decreasing_count)
    const ftd_collections = grouped_colls.star::sortBy(decreasing_count)

    if (own_collections.length === 0) {
      const icon = 'tag'
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

    const own_collections_links = own_collections.map((props) => r(LibraryPanelLink, props))
    const ftd_collections_links = ftd_collections.map((props) => r(LibraryPanelLink, props))

    const installed_count = caves.length
    const search_count = games.search::count()

    const in_progress_items = caves::filter(is_cave_interesting::partial(panel))

    const cave_items = in_progress_items::map((cave) => {
      const task = cave.task
      const error = cave.error
      const path = `caves/${cave.id}`
      const cave_game = games::getIn(['caved', cave.game_id])

      const props = {
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
    })

    let links = []

    if (is_developer) {
      const dashboard_link = r(LibraryPanelLink, {
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
      const loc_matches = panel.match(/^locations\/(.*)$/)
      if (loc_matches) {
        const loc_name = loc_matches[1]
        const loc = state.install_locations.locations[loc_name]

        let path = loc.path

        // XXX perf: can definitely be handled store-side
        state.install_locations.aliases::each((short, long) => {
          path = path.replace(long, short)
        })

        const link = r(LibraryPanelLink, {before: r(Icon, {icon: 'folder'}), name: panel, label: path, panel, games})
        links.push(link)
      }
    }

    links.push(r.div({className: 'separator'}))

    links = links.concat(own_collections_links)
    links = links.concat(ftd_collections_links)

    const num_cave_items = cave_items.length
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

export default LibrarySidebar
