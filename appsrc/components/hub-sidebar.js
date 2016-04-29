
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {map, where} from 'underline'
import classNames from 'classnames'
import {createSelector, createStructuredSelector} from 'reselect'

import * as actions from '../actions'
import defaultImages from '../constants/default-images'
import {pathToIcon} from '../util/navigation'

import Icon from './icon'
import Dropdown from './dropdown'
import HubSidebarItem from './hub-sidebar-item'

export class HubSidebar extends Component {
  render () {
    const {t, osx, sidebarWidth, fullscreen, path: currentPath, tabs, tabData, navigate, counts, closeTab, moveTab, openTabContextMenu} = this.props
    const classes = classNames('hub-sidebar', {osx, fullscreen})
    const sidebarStyle = {
      width: sidebarWidth + 'px'
    }

    return <div className={classes} style={sidebarStyle}>
      <div className='title-bar-padder'/>
      {this.dropdown()}

      <div className='sidebar-items'>
        <h2>{t('sidebar.category.basics')}</h2>
        {tabs.constant::map((item) => {
          const {path} = item
          const {label = 'Loading...'} = tabData[item.path] || {}
          const icon = pathToIcon(item.path)
          const active = currentPath === item.path
          const onClick = () => navigate(item.path)
          const onContextMenu = () => {}

          const props = {path, label, icon, active, onClick, t, onContextMenu}
          return <HubSidebarItem {...props}/>
        })}

        <h2>{t('sidebar.category.tabs')}</h2>
        {tabs.transient.length
          ? tabs.transient::map((item, index) => {
            const {path} = item
            const data = tabData[item.path] || {}
            const {label = 'Loading...'} = data
            const icon = pathToIcon(item.path)
            const active = currentPath === item.path
            const onClick = () => navigate(path)
            const onClose = () => closeTab(path)
            const onContextMenu = () => openTabContextMenu({path})
            const count = counts[item.path]

            const props = {index, path, label, icon, active, onClick, count, onClose, onContextMenu, moveTab, data, t}
            return <HubSidebarItem {...props}/>
          })
          : <section className='empty'>
            <span className='icon icon-like'/>
            {t('sidebar.no_tabs')}
          </section>
        }
      </div>
    </div>
  }

  me () {
    const me = this.props.me || {}
    const {coverUrl = defaultImages.avatar, username = ''} = me

    return <section className='me'>
      <img src={coverUrl}/>
      <span>{username}</span>
      <div className='filler'/>
      <Icon icon='triangle-down'/>
    </section>
  }

  dropdown () {
    const {viewCreatorProfile, viewCommunityProfile, changeUser, openPreferences} = this.props

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
        icon: 'cog',
        label: ['sidebar.preferences'],
        onClick: openPreferences
      },
      {
        icon: 'exit',
        label: ['sidebar.log_out'],
        onClick: changeUser
      }
    ]
    return <Dropdown items={items} inner={this.me()}/>
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
  openPreferences: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  osx: (state) => state.system.osx,
  fullscreen: (state) => state.ui.mainWindow.fullscreen,
  sidebarWidth: (state) => state.preferences.sidebarWidth || 240,
  me: (state) => state.session.credentials.me,
  path: (state) => state.session.navigation.path,
  tabs: (state) => state.session.navigation.tabs,
  tabData: (state) => state.session.navigation.tabData,

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
  navigate: (path) => dispatch(actions.navigate(path)),
  closeTab: (path) => dispatch(actions.closeTab(path)),
  moveTab: (before, after) => dispatch(actions.moveTab({before, after})),

  viewCreatorProfile: () => dispatch(actions.viewCreatorProfile()),
  viewCommunityProfile: () => dispatch(actions.viewCommunityProfile()),
  changeUser: () => dispatch(actions.changeUser()),
  openPreferences: () => dispatch(actions.navigate('preferences')),
  openTabContextMenu: (data) => dispatch(actions.openTabContextMenu(data))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubSidebar)
