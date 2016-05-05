
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {map, where} from 'underline'
import classNames from 'classnames'
import {createSelector, createStructuredSelector} from 'reselect'

import * as actions from '../actions'
import defaultImages from '../constants/default-images'
import {pathToIcon, makeLabel} from '../util/navigation'

import Icon from './icon'
import Dropdown from './dropdown'
import HubSidebarItem from './hub-sidebar-item'

export class HubSidebar extends Component {
  render () {
    const {t, osx, mini, sidebarWidth, fullscreen, id: currentId, tabs, tabData,
      navigate, counts, closeTab, moveTab, openTabContextMenu, newTab} = this.props
    const classes = classNames('hub-sidebar', {osx, fullscreen, mini})
    const sidebarStyle = {
      width: mini ? '67px' : sidebarWidth + 'px'
    }

    return <div className={classes} style={sidebarStyle}>
      <div className='title-bar-padder'/>
      {this.dropdown()}

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
          const n = (index + 1)
          const kbShortcut = <div className='kb-shortcut'>
            {osx
              ? <Icon icon='command'/>
              : <Icon icon='ctrl'/>
            }
            +{n}
          </div>

          const props = {id, path, label, icon, active, onClick, t, onContextMenu, kbShortcut}
          return <HubSidebarItem {...props}/>
        })}

        <h2>{t('sidebar.category.tabs')}</h2>
        {tabs.transient::map((id, index) => {
          const data = tabData[id] || {}
          const {path} = tabData
          const iconImage = data.webFavicon
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
          <div className='kb-shortcut'>
            {osx
              ? <Icon icon='command'/>
              : <Icon icon='ctrl'/>
            }
            +T
          </div>
        </section>
      </div>
    </div>
  }

  me () {
    const me = this.props.me || {}
    const {coverUrl = defaultImages.avatar, username = ''} = me

    return <section className='hub-sidebar-item me'>
      <img src={coverUrl}/>
      <span className='label'>{username}</span>
      <div className='filler'/>
      <Icon icon='triangle-down' classes={['me-dropdown']}/>
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
  mini: PropTypes.bool,
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
  newTab: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  osx: (state) => state.system.osx,
  fullscreen: (state) => state.ui.mainWindow.fullscreen,
  sidebarWidth: (state) => state.preferences.sidebarWidth || 240,
  mini: (state) => state.preferences.miniSidebar,
  me: (state) => state.session.credentials.me,
  id: (state) => state.session.navigation.id,
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
  navigate: (id) => dispatch(actions.navigate(id)),
  closeTab: (id) => dispatch(actions.closeTab(id)),
  moveTab: (before, after) => dispatch(actions.moveTab({before, after})),

  viewCreatorProfile: () => dispatch(actions.viewCreatorProfile()),
  viewCommunityProfile: () => dispatch(actions.viewCommunityProfile()),
  changeUser: () => dispatch(actions.changeUser()),
  openPreferences: () => dispatch(actions.navigate('preferences')),
  openTabContextMenu: (id) => dispatch(actions.openTabContextMenu({id})),
  newTab: () => dispatch(actions.newTab())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubSidebar)
