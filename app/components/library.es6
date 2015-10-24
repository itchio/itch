
import React from 'react'
import mori from 'mori'
import {PropTypes} from 'react'
import Component from './component'
import classNames from 'classnames'

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
    let {state} = this.props

    return <div className='library_page'>
      <LibrarySidebar state={state}/>
      <LibraryContent state={state}/>
    </div>
  }
}

LibraryPage.propTypes = {
  state: PropTypes.any
}

/**
 * A list of tabs, collections and installed games
 * TODO: this component does too much, split it!
 */
class LibrarySidebar extends Component {
  render () {
    let {state} = this.props
    let panel = mori.get(state, 'panel')
    let installs = mori.get(state, 'installs')
    let collections = mori.get(state, 'collections')
    let games = mori.get(state, 'games')

    let collection_items = mori.reduceKV((acc, id, collection) => {
      let props = {
        games,
        name: `collections/${id}`,
        label: mori.get(collection, 'title'),
        before: <Icon icon='tag'/>,
        panel
      }
      acc.push(<LibraryPanelLink {...props} key={id}/>)
      return acc
    }, [], collections)

    let install_items = mori.reduceKV((acc, id, install) => {
      let progress = mori.get(install, 'progress')
      let task = mori.get(install, 'task')
      let error = mori.get(install, 'error')

      if (!(progress > 0 || task === 'error')) {
        return ''
      }

      let props = {
        games: {}, // don't display number bullet
        name: `installs/${id}`,
        label: mori.getIn(install, ['game', 'title']),
        error: task === 'error' && error,
        progress: mori.get(install, 'progress'),
        before: <TaskIcon task={install.task}/>,
        panel
      }
      acc.push(<LibraryPanelLink {...props} key={id}/>)
      return acc
    }, [], installs)

    return <div className={classNames('sidebar', {frameless})}>
      <UserPanel/>
      <div className='panel_links'>
        <LibraryPanelLink before={<Icon icon='heart-filled'/>} name='owned' label='Owned' panel={panel} games={games}/>
        <LibraryPanelLink before={<Icon icon='gamepad'/>} name='installed' label='Installed' panel={panel} games={games}/>
        <LibraryPanelLink before={<Icon icon='stats'/>} name='dashboard' label='Dashboard' panel={panel} games={games}/>

        <div className='separator'/>
        {mori.intoArray(collection_items)}

        {install_items.length
        ? <div>
            <div className='separator'/>
            {mori.intoArray(install_items)}
          </div>
        : ''}
      </div>
    </div>
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
    let {state} = this.props
    let panel = mori.get(state, 'panel')
    let installs = mori.get(state, 'installs')
    let games = mori.get(state, 'games')

    let shown_games = mori.get(games, panel) || mori.list()

    return <div className='main_content'>
      <GameList games={shown_games} installs={installs}/>
    </div>
  }
}

LibraryContent.propTypes = {
  state: PropTypes.any
}

/**
 * A sidebar link to one of the library's panels. Could
 * be a link to a tab, or to a specific collection or install.
 */
class LibraryPanelLink extends Component {
  render () {
    let {name, panel, label, progress, before = '', error, games = {}} = this.props
    let relevant_games = mori.get(games, name) || mori.list()
    let game_count = mori.count(relevant_games)
    let current = (name === panel)

    let _progress = progress ? ` (${(progress * 100).toFixed()}%)` : ''
    let _label = `${label}${_progress}`

    return <div className={classNames('panel_link', {current})} onClick={() => AppActions.focus_panel(this.props.name)}
      >
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
  error: PropTypes.any,
  games: PropTypes.object,
  before: PropTypes.any
}

export {LibraryPage, LibrarySidebar, LibraryContent, LibraryPanelLink}
