
import React, {PropTypes, Component} from 'react'
import moment from 'moment'
import {connect} from './connect'
import {map, where} from 'underline'
import classNames from 'classnames'
import {createSelector, createStructuredSelector} from 'reselect'

import * as actions from '../actions'
import defaultImages from '../constants/default-images'
import urls from '../constants/urls'
import {pathToIcon, makeLabel} from '../util/navigation'

import {app} from '../electron'

import Icon from './icon'
import Dropdown from './dropdown'
import HubSidebarItem from './hub-sidebar-item'

import {debounce} from 'underline'

export function versionString () {
  return `itch v${app.getVersion()}`
}

export class HubSidebar extends Component {
  constructor () {
    super()
    this.triggerSearch = this.triggerSearch::debounce(100)
    this.onSearchKeyUp = ::this.onSearchKeyUp
    this.onSearchKeyDown = ::this.onSearchKeyDown
    this.onSearchChange = ::this.onSearchChange
    this.onSearchFocus = ::this.onSearchFocus
    this.onSearchBlur = ::this.onSearchBlur::debounce(200)
  }

  render () {
    const {t, osx, sidebarWidth, fullscreen, id: currentId, tabs, tabData,
      navigate, counts, progresses, sublabels, closeTab, closeAllTabs, moveTab, openTabContextMenu, newTab, searchLoading} = this.props
    const classes = classNames('hub-sidebar', {osx, fullscreen})
    const sidebarStyle = {
      width: sidebarWidth + 'px'
    }
    const searchClasses = classNames('search', {loading: searchLoading})

    return <div className={classes} style={sidebarStyle}>
      <div className='title-bar-padder'/>

      <div className='logo hint--bottom' onClick={() => navigate('featured')} data-hint={versionString()}>
        <img src='static/images/logos/app-white.svg'/>
      </div>

      <section className={searchClasses}>
        <input id='search' ref='search' type='search'
          placeholder={t('search.placeholder')}
          onKeyDown={this.onSearchKeyDown}
          onKeyUp={this.onSearchKeyUp}
          onChange={this.onSearchChange}
          onFocus={this.onSearchFocus}
          onBlur={this.onSearchBlur}/>
        <span className='icon icon-search'/>
      </section>

      <div className='sidebar-items'>
        <h2>
          <span className='label'>{t('sidebar.category.basics')}</span>
        </h2>
        {tabs.constant::map((id, index) => {
          const data = tabData[id] || {}
          const {path} = data
          const label = makeLabel(id, tabData)
          const icon = pathToIcon(path)
          const active = currentId === id
          const onClick = () => navigate(id)
          const onContextMenu = () => {}

          const props = {id, path, label, icon, active, onClick, t, onContextMenu}
          return <HubSidebarItem {...props}/>
        })}

        <h2>
          <span className='label'>{t('sidebar.category.tabs')}</span>
          <div className='filler'/>
          <span className='action hint--left' data-hint={t('sidebar.close_all_tabs')} onClick={closeAllTabs}>
            <span className='icon icon-delete'/>
          </span>
        </h2>
        {tabs.transient::map((id, index) => {
          const data = tabData[id] || {}
          const {path} = data
          const iconImage = /^url/.test(path) && data.webFavicon
          const label = makeLabel(id, tabData)
          const icon = pathToIcon(path)
          const active = currentId === id
          const onClick = () => navigate(id)
          const onClose = () => closeTab(id)
          const onContextMenu = () => openTabContextMenu(id)
          const count = counts[id]
          const progress = progresses[id]
          const sublabel = sublabels[id]

          const props = {index, id, path, label, icon, iconImage, active,
            onClick, count, progress, onClose, onContextMenu, moveTab, data, t,
            sublabel}
          return <HubSidebarItem {...props}/>
        })}
        <section className='hub-sidebar-item new-tab' onClick={newTab}>
          <div className='row'>
            <span className='symbol icon icon-plus'/>
            <span className='label'>{t('sidebar.new_tab')}</span>
            <div className='filler'/>
          </div>
        </section>
      </div>

      <section className='sidebar-blank'/>

      {this.dropdown()}
    </div>
  }

  onSearchFocus (e) {
    this.props.focusSearch()
  }

  onSearchBlur (e) {
    this.props.closeSearch()
  }

  onSearchChange (e) {
    this.triggerSearch()
  }

  onSearchKeyDown (e) {
    const {key} = e

    let passthrough = false

    if (key === 'Escape') {
      // default behavior is to clear - don't
    } else if (key === 'ArrowDown') {
      this.props.searchHighlightOffset(1)
      // default behavior is to jump to end of input - don't
    } else if (key === 'ArrowUp') {
      this.props.searchHighlightOffset(-1)
      // default behavior is to jump to start of input - don't
    } else {
      passthrough = true
    }

    if (!passthrough) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  }

  onSearchKeyUp (e) {
    const {key} = e

    if (key === 'Escape') {
      return
    } else if (key === 'ArrowDown') {
      return
    } else if (key === 'ArrowUp') {
      return
    } else if (key === 'Enter') {
      return
    }
    console.log(`Triggering search, key was ${key}`)

    this.triggerSearch()
  }

  triggerSearch () {
    const {search} = this.refs
    if (!search) return

    console.log(`Searching for ${JSON.stringify(search.value)}`)
    this.props.search(search.value)
  }

  me () {
    const me = this.props.me || {}
    const {coverUrl = defaultImages.avatar, username, displayName} = me

    return <section className='hub-sidebar-item me'>
      <img src={coverUrl}/>
      <span className='label'>{username || displayName}</span>
      <div className='filler'/>
      <Icon icon='triangle-down' classes={['me-dropdown']}/>
    </section>
  }

  dropdown () {
    const {viewCreatorProfile, viewCommunityProfile, changeUser,
      openPreferences, navigate, copyToClipboard, quit, reportIssue,
      openUrl, checkForSelfUpdate} = this.props

    const items = [
      {
        icon: 'rocket',
        label: ['sidebar.view_creator_profile'],
        onClick: viewCreatorProfile
      },
      {
        icon: 'fire',
        label: ['sidebar.view_community_profile'],
        onClick: viewCommunityProfile
      },
      {
        type: 'separator'
      },
      {
        icon: 'download',
        label: ['sidebar.downloads'],
        onClick: () => navigate('downloads')
      },
      {
        icon: 'cog',
        label: ['sidebar.preferences'],
        onClick: openPreferences
      },
      {
        type: 'separator'
      },
      {
        icon: 'checkmark',
        label: versionString(),
        onClick: () => copyToClipboard(versionString()),
        type: 'info'
      },
      {
        icon: 'repeat',
        label: ['menu.help.check_for_update'],
        onClick: () => checkForSelfUpdate()
      },
      {
        icon: 'search',
        label: ['menu.help.search_issue'],
        onClick: () => openUrl(`${urls.itchRepo}/search?type=Issues`)
      },
      {
        icon: 'bug',
        label: ['menu.help.report_issue'],
        onClick: () => reportIssue()
      },
      {
        icon: 'lifebuoy',
        label: ['menu.help.help'],
        onClick: () => navigate('url/' + urls.manual)
      },
      {
        type: 'separator'
      },
      {
        icon: 'shuffle',
        label: ['menu.account.change_user'],
        onClick: changeUser
      },
      {
        icon: 'exit',
        label: ['menu.file.quit'],
        onClick: quit
      }
    ]
    return <Dropdown items={items} inner={this.me()} updown/>
  }
}

HubSidebar.propTypes = {
  osx: PropTypes.bool,
  sidebarWidth: PropTypes.number.isRequired,
  fullscreen: PropTypes.bool,
  me: PropTypes.shape({
    coverUrl: PropTypes.string,
    username: PropTypes.string.isRequired
  }),

  id: PropTypes.string.isRequired,
  path: PropTypes.string,
  tabs: PropTypes.shape({
    constant: PropTypes.array,
    transient: PropTypes.array
  }),
  tabData: PropTypes.object,

  counts: PropTypes.shape({
    history: PropTypes.number,
    downloads: PropTypes.number
  }),

  t: PropTypes.func.isRequired,
  viewCreatorProfile: PropTypes.func.isRequired,
  viewCommunityProfile: PropTypes.func.isRequired,
  changeUser: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  closeTab: PropTypes.func.isRequired,
  moveTab: PropTypes.func.isRequired,
  openTabContextMenu: PropTypes.func.isRequired,
  openPreferences: PropTypes.func.isRequired,
  newTab: PropTypes.func.isRequired,

  searchLoading: PropTypes.bool,
  search: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  osx: (state) => state.system.osx,
  fullscreen: (state) => state.ui.mainWindow.fullscreen,
  sidebarWidth: (state) => state.preferences.sidebarWidth || 240,
  me: (state) => state.session.credentials.me,
  id: (state) => state.session.navigation.id,
  tabs: (state) => state.session.navigation.tabs,
  tabData: (state) => state.session.navigation.tabData,
  searchLoading: (state) => state.session.search.loading,

  counts: createSelector(
    (state) => state.history.itemsByDate,
    (state) => state.downloads.finishedDownloads,
    (history, downloads) => ({
      history: history::where({active: true}).length,
      downloads: downloads.length
    })
  ),

  progresses: (state) => ({
    downloads: state.downloads.progress
  }),

  sublabels: (state) => {
    const {activeDownload} = state.downloads
    let label = null
    if (activeDownload && activeDownload.progress > 0) {
      if (state.downloads.downloadsPaused) {
        label = ['grid.item.downloads_paused']
      } else {
        label = `${activeDownload.game.title} — ${(moment.duration(activeDownload.eta, 'seconds').locale(state.i18n.lang).humanize())}`
      }
    }

    return {
      downloads: label
    }
  }
})

const mapDispatchToProps = (dispatch) => ({
  navigate: (id) => dispatch(actions.navigate(id)),
  closeTab: (id) => dispatch(actions.closeTab(id)),
  closeAllTabs: (id) => dispatch(actions.closeAllTabs()),
  moveTab: (before, after) => dispatch(actions.moveTab({before, after})),

  viewCreatorProfile: () => dispatch(actions.viewCreatorProfile()),
  viewCommunityProfile: () => dispatch(actions.viewCommunityProfile()),
  changeUser: () => dispatch(actions.changeUser()),
  openPreferences: () => dispatch(actions.navigate('preferences')),
  openTabContextMenu: (id) => dispatch(actions.openTabContextMenu({id})),
  newTab: () => dispatch(actions.newTab()),
  copyToClipboard: (text) => dispatch(actions.copyToClipboard(text)),

  focusSearch: (query) => dispatch(actions.focusSearch(query)),
  closeSearch: (query) => dispatch(actions.closeSearch(query)),
  search: (query) => dispatch(actions.search(query)),

  reportIssue: () => dispatch(actions.reportIssue()),
  openUrl: (url) => dispatch(actions.openUrl(url)),

  searchHighlightOffset: (offset) => dispatch(actions.searchHighlightOffset(offset)),

  checkForSelfUpdate: () => dispatch(actions.checkForSelfUpdate()),

  quit: () => dispatch(actions.quit())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubSidebar)
