
import React from 'react'
import {Component, PropTypes} from 'react'
import classNames from 'classnames'
import {pairs} from 'underscore'

import {UserPanel} from './user-panel'
import {GameList} from './game-list'
import {TaskIcon, ErrorList, ProgressBar} from './misc'

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
    let {panel, installs = {}, collections = {}} = this.props

    let collection_items = pairs(collections).map(([id, collection]) => {
      let props = {
        name: `collections/${id}`,
        label: collection.title,
        panel
      }
      return <LibraryPanelLink {...props} key={id}/>
    })

    let has_installs = false
    let install_items = pairs(installs).map(([id, install]) => {
      if (!(install.progress > 0)) {
        return ''
      }

      let props = {
        name: `installs/${id}`,
        label: install.game.title,
        error: (install.task === 'error' && install.error),
        progress: install.progress,
        task: install.task,
        panel
      }
      has_installs = true
      return <LibraryPanelLink {...props} key={id}/>
    })

    return <div className={classNames('sidebar', {frameless})}>
      <UserPanel {...this.props}/>
      <div className='panel_links'>
        <h3>Tabs</h3>

        <LibraryPanelLink name='owned' label='Owned' panel={panel}/>
        <LibraryPanelLink name='dashboard' label='Dashboard' panel={panel}/>

        <h3>Collections</h3>

        {collection_items}

        {has_installs
        ? <div>
            <h3>In progress</h3>
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
  collections: PropTypes.object
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
    let {name, panel, label, progress, task, error} = this.props
    let current = (name === panel)

    let _progress = progress ? ` (${(progress * 100).toFixed()}%)` : ''
    let _label = `${label}${_progress}`

    return <div className={classNames('panel_link', {current})}
      onClick={() => AppActions.focus_panel(this.props.name) }>
      <TaskIcon {...{task}}/>
      {_label}
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
  task: PropTypes.string,
  error: PropTypes.string
}

export {LibraryPage, LibrarySidebar, LibraryContent, LibraryPanelLink}
