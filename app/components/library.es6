
import React from 'react'
import {Component, PropTypes} from 'react'
import classNames from 'classnames'
import {pairs} from 'underscore'

import {UserPanel} from './user-panel'
import {GameList} from './game-list'
import {Icon, TaskIcon, ErrorList, ProgressBar} from './misc'

import AppActions from '../actions/app-actions'

// Hack for frameless styling
let frameless = process.platform === 'darwin'

/**
 * The main state of the client - displaying the library
 */
class LibraryPage extends Component {
  render () {
    let props = this.props

    return <div className='library_page'>
      <LibrarySidebar {...props}/>
      <LibraryContent {...props}/>
    </div>
  }
}

/**
 * A list of tabs, collections and installed games
 */
class LibrarySidebar extends Component {
  render () {
    let {panel, installs = {}, collections = {}, games = {}} = this.props

    let collection_items = pairs(collections).map(([id, collection]) => {
      let props = {
        games,
        name: `collections/${id}`,
        label: collection.title,
        before: <Icon icon='tag'/>,
        panel
      }
      return <LibraryPanelLink {...props} key={id}/>
    })

    let has_installs = false
    let install_items = pairs(installs).map(([id, install]) => {
      if (!(install.progress > 0 || install.task === 'error')) {
        return ''
      }

      let props = {
        games: {}, // don't display number bullet
        name: `installs/${id}`,
        label: install.game.title,
        error: (install.task === 'error' && install.error),
        progress: install.progress,
        before: <TaskIcon task={install.task}/>,
        panel
      }
      has_installs = true
      return <LibraryPanelLink {...props} key={id}/>
    })

    return <div className={classNames('sidebar', {frameless})}>
      <UserPanel {...this.props}/>
      <div className='panel_links'>
        <LibraryPanelLink before={<Icon icon='heart-filled'/>} name='owned' label='Owned' panel={panel} games={games}/>
        <LibraryPanelLink before={<Icon icon='gamepad'/>} name='installed' label='Installed' panel={panel} games={games}/>
        <LibraryPanelLink before={<Icon icon='stats'/>} name='dashboard' label='Dashboard' panel={panel} games={games}/>

        <div className='separator'/>
        {collection_items}

        {has_installs
        ? <div>
            <div className='separator'/>
            {install_items}
          </div>
        : ''}
      </div>
    </div>
  }
}

LibrarySidebar.propTypes = {
  panel: PropTypes.string,
  installs: PropTypes.object,
  collections: PropTypes.object,
  games: PropTypes.object
}

/**
 * A list of games corresponding to whatever library tab is selected
 */
class LibraryContent extends Component {
  render () {
    let {panel, installs = {}, games = {}} = this.props
    let shown_games = games[panel] || []

    return <div className='main_content'>
      <GameList games={shown_games} installs={installs}/>
    </div>
  }
}

LibraryContent.propTypes = {
  games: PropTypes.object,
  installs: PropTypes.object,
  panel: PropTypes.string
}

/**
 * A sidebar link to one of the library's panels. Could
 * be a link to a tab, or to a specific collection or install.
 */
class LibraryPanelLink extends Component {
  render () {
    let {name, panel, label, progress, before = '', error, games = {}} = this.props
    let relevant_games = games[name] || []
    let game_count = relevant_games.length
    let current = (name === panel)

    let _progress = progress ? ` (${(progress * 100).toFixed()}%)` : ''
    let _label = `${label}${_progress}`

    return <div className={classNames('panel_link', {current})} onClick={() => AppActions.focus_panel(this.props.name)}>
      {before}
      {_label}
      {game_count > 0
      ? <span className='bubble'>{game_count}</span>
      : ''}
      <ProgressBar {...{progress}}/>
      <ErrorList errors={error}/>
    </div>
  }
}

LibraryPanelLink.propTypes = {
  name: PropTypes.string,
  panel: PropTypes.string,
  label: PropTypes.string,
  progress: PropTypes.number,
  error: PropTypes.string,
  games: PropTypes.object,
  before: PropTypes.any
}

export {LibraryPage, LibrarySidebar, LibraryContent, LibraryPanelLink}
