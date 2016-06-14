
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {map, where} from 'underline'
import classNames from 'classnames'
import {createSelector, createStructuredSelector} from 'reselect'

import * as actions from '../actions'
import defaultImages from '../constants/default-images'
import urls from '../constants/urls'
import {pathToIcon, makeLabel} from '../util/navigation'

import Icon from './icon'
import Dropdown from './dropdown'
import HubSidebarItem from './hub-sidebar-item'

export class HubSidebar extends Component {
  render () {
    const {t, osx, sidebarWidth, fullscreen, id: currentId, tabs, tabData,
      navigate, counts, closeTab, moveTab, openTabContextMenu, newTab, searchLoading} = this.props
    const classes = classNames('hub-sidebar', {osx, fullscreen})
    const sidebarStyle = {
      width: sidebarWidth + 'px'
    }
    const searchClasses = classNames('search', {loading: searchLoading})

    return <div className={classes} style={sidebarStyle}>
      <div className='title-bar-padder'/>

      <div className='logo'>
        <img src='static/images/logos/app-white.svg'/>
      </div>

      <section className={searchClasses}>
        <input id='search' ref='search' type='search' placeholder={t('search.placeholder')} onKeyPress={::this.onQueryChanged} onKeyUp={::this.onQueryChanged} onChange={::this.onQueryChanged} onFocus={::this.onSearchFocus} onBlur={::this.onSearchBlur}/>
        <span className='icon icon-search'/>
      </section>

      <div className='sidebar-items'>
        <h2>{t('sidebar.category.basics')}</h2>
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

        <h2>{t('sidebar.category.tabs')}</h2>
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

          const props = {index, id, path, label, icon, iconImage, active, onClick, count, onClose, onContextMenu, moveTab, data, t}
          return <HubSidebarItem {...props}/>
        })}
        <section className='hub-sidebar-item new-tab' onClick={newTab}>
          <span className='symbol icon icon-plus'/>
          <span className='label'>{t('sidebar.new_tab')}</span>
          <div className='filler'/>
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
    setTimeout(this.props.closeSearch, 200)
  }

  onQueryChanged (e) {
    const {search} = this.refs
    if (!search) return

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
    const {viewCreatorProfile, viewCommunityProfile, changeUser, openPreferences, navigate} = this.props

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
        icon: 'cog',
        label: ['sidebar.preferences'],
        onClick: openPreferences
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
        icon: 'exit',
        label: ['sidebar.log_out'],
        onClick: changeUser
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
    (state) => state.tasks.downloadsByOrder,
    (history, downloads) => ({
      history: history::where({active: true}).length,
      downloads: downloads.length
    })
  )
})

const mapDispatchToProps = (dispatch) => ({
  navigate: (id) => dispatch(actions.navigate(id)),
  closeTab: (id) => dispatch(actions.closeTab(id)),
  moveTab: (before, after) => dispatch(actions.moveTab({before, after})),

  viewCreatorProfile: () => dispatch(actions.viewCreatorProfile()),
  viewCommunityProfile: () => dispatch(actions.viewCommunityProfile()),
  changeUser: () => dispatch(actions.changeUser()),
  openPreferences: () => dispatch(actions.navigate('preferences')),
  openTabContextMenu: (id) => dispatch(actions.openTabContextMenu({id})),
  newTab: () => dispatch(actions.newTab()),

  focusSearch: (query) => dispatch(actions.focusSearch(query)),
  closeSearch: (query) => dispatch(actions.closeSearch(query)),
  search: (query) => dispatch(actions.search(query))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubSidebar)
