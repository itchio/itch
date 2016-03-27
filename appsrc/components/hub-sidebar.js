
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {map} from 'underline'
import classNames from 'classnames'

import * as actions from '../actions'
import defaultImages from '../constants/default-images'

import Icon from './icon'
import Dropdown from './dropdown'

export class HubSidebar extends Component {

  constructor () {
    super()
  }

  render () {
    const {t, osx, fullscreen, path, tabs, navigate, closeTab} = this.props
    const classes = classNames('hub-sidebar', {osx, fullscreen})

    return <div className={classes}>
      <div className='title-bar-padder'/>
      {this.dropdown()}

      <h2>Constant</h2>
      {tabs.constant::map((item) => {
        const classes = classNames({active: path === item.path})
        const onClick = () => navigate(item.path)

        return <section key={item.path} className={classes} onClick={onClick}>
          <span className={`icon icon-${this.pathToIcon(item.path)}`}/>
          {t.format(item.label)}
        </section>
      })}

      <h2>Transient</h2>
      {tabs.transient.length
        ? tabs.transient::map((item) => {
          const classes = classNames({
            active: path === item.path
          })
          const onClick = () => navigate(item.path)

          return <section key={item.path} className={classes} onClick={onClick}>
            <span className={`icon icon-${this.pathToIcon(item.path)}`}/>
            {t.format(item.label)}
            <div className='filler'/>
            <span className='icon icon-cross' onClick={(e) => {
              closeTab(item.path)
              e.stopPropagation()
            }}/>
          </section>
        })
        : <section className='empty'>
        <span className='icon icon-neutral'/>
        No tabs
        </section>
      }
    </div>
  }

  pathToIcon (path) {
    if (path === 'featured') {
      return 'star'
    }
    if (path === 'dashboard') {
      return 'rocket'
    }
    if (path === 'library') {
      return 'heart-filled'
    }
    if (path === 'preferences') {
      return 'cog'
    }
    if (path === 'history') {
      return 'history'
    }
    if (path === 'downloads') {
      return 'download'
    }
    if (/^collections/.test(path)) {
      return 'video_collection'
    }
    if (/^games/.test(path)) {
      return 'gamepad'
    }
    if (/^users/.test(path)) {
      return 'users'
    }
    return 'earth'
  }

  me () {
    const {me = {}} = this.props
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
        icon: 'dog',
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

  t: PropTypes.func.isRequired,
  viewCreatorProfile: PropTypes.func.isRequired,
  viewCommunityProfile: PropTypes.func.isRequired,
  changeUser: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  closeTab: PropTypes.func.isRequired,
  openPreferences: PropTypes.func.isRequired
}

const mapStateToProps = (state) => ({
  osx: state.system.osx,
  fullscreen: state.ui.mainWindow.fullscreen,
  me: state.session.credentials.me,
  path: state.session.navigation.path,
  tabs: state.session.navigation.tabs
})

const mapDispatchToProps = (dispatch) => ({
  navigate: (path) => dispatch(actions.navigate(path)),
  closeTab: (path) => dispatch(actions.closeTab(path)),

  viewCreatorProfile: () => dispatch(actions.viewCreatorProfile()),
  viewCommunityProfile: () => dispatch(actions.viewCommunityProfile()),
  changeUser: () => dispatch(actions.changeUser()),
  openPreferences: () => dispatch(actions.navigate('preferences'))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubSidebar)
