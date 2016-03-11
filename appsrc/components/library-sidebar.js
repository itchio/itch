
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

const isCaveInteresting = (panel, cave) => {
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
    const isDeveloper = state::getIn(['credentials', 'me', 'developer'])
    const featuredCollectionIdsMap = state::getIn(['collections', 'featuredIds'])::indexBy((x) => x)

    const collectionItems = collections::map((collection) => {
      const featured = featuredCollectionIdsMap[collection.id]
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

    const decreasingCount = (x) => -games[x.name]::count()
    const groupedColls = collectionItems::groupBy((x) => x.icon)

    const ownCollections = groupedColls.tag::sortBy(decreasingCount)
    const ftdCollections = groupedColls.star::sortBy(decreasingCount)

    if (ownCollections.length === 0) {
      const icon = 'tag'
      ownCollections.push({
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

    const ownCollectionsLinks = ownCollections.map((props) => r(LibraryPanelLink, props))
    const ftdCollectionsLinks = ftdCollections.map((props) => r(LibraryPanelLink, props))

    const installedCount = caves.length
    const searchCount = games.search::count()

    const inProgressItems = caves::filter(isCaveInteresting::partial(panel))

    const caveItems = inProgressItems::map((cave) => {
      const task = cave.task
      const error = cave.error
      const path = `caves/${cave.id}`
      const caveGame = games::getIn(['caved', cave.gameId])

      const props = {
        games: {}, // don't display number bullet
        name: path,
        label: caveGame.title,
        error: task === 'error' && error,
        progress: cave.progress,
        before: r(TaskIcon, {task}),
        panel,
        key: cave.id
      }
      return r(LibraryPanelLink, props)
    })

    let links = []

    if (isDeveloper) {
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
      count: installedCount
    }))

    links.push(r(LibraryPanelLink, {
      before: r(Icon, {icon: 'search'}),
      name: 'search',
      label: t('sidebar.search'),
      panel, games, className: 'search',
      count: panel === 'search' && searchCount
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
      const locMatches = panel.match(/^locations\/(.*)$/)
      if (locMatches) {
        const locName = locMatches[1]
        const loc = state.installLocations.locations[locName]

        let path = loc.path

        // XXX perf: can definitely be handled store-side
        state.installLocations.aliases::each((short, long) => {
          path = path.replace(long, short)
        })

        const link = r(LibraryPanelLink, {before: r(Icon, {icon: 'folder'}), name: panel, label: path, panel, games})
        links.push(link)
      }
    }

    links.push(r.div({className: 'separator'}))

    links = links.concat(ownCollectionsLinks)
    links = links.concat(ftdCollectionsLinks)

    const numCaveItems = caveItems.length
    if (numCaveItems > 0) {
      links.push(r.div({className: 'separator'}))
      links = links.concat(caveItems)
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
