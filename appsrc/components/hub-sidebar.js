
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {map} from 'underline'
import classNames from 'classnames'

import * as actions from '../actions'
import defaultImages from '../constants/default-images'

import Icon from './icon'

export class HubSidebar extends Component {
  constructor () {
    super()
    this.state = {
      dropdownOpen: false
    }
  }

  toggleDropdown () {
    const {dropdownOpen} = this.state
    this.setState({...this.state, dropdownOpen: !dropdownOpen})
  }

  render () {
    const {osx, fullscreen, path, tabs, navigate, closeTab} = this.props
    const classes = classNames('hub-sidebar', {osx, fullscreen})

    return <div className={classes}>
      <div className='title-bar-padder'/>
      {this.me()}
      {this.dropdown()}

      <h2>Constant</h2>
      {tabs.constant::map((item) => {
        const classes = classNames({active: path === item.path})
        const onClick = () => navigate(item.path)

        return <section key={item.path} className={classes} onClick={onClick}>
          <span className={`icon icon-${this.pathToIcon(item.path)}`}/>
          {item.label}
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
            {item.label}
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
    if (/^collections/.test(path)) {
      return 'tag'
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

    return <section className='me' onClick={() => this.toggleDropdown()}>
      <img src={coverUrl}/>
      <span>{username}</span>
      <div className='filler'/>
      <Icon icon='triangle-down'/>
    </section>
  }

  dropdown () {
    const {t, viewCreatorProfile, viewCommunityProfile, changeUser} = this.props
    const dropdownClasses = classNames('dropdown', {active: this.state.dropdownOpen})

    return <div className='dropdown-container'>
      <div className={dropdownClasses}>
        <section onClick={viewCreatorProfile}>
          <span className='icon icon-rocket'/>
          {t('sidebar.view_creator_profile')}
        </section>
        <section onClick={viewCommunityProfile}>
          <span className='icon icon-fire'/>
          {t('sidebar.view_community_profile')}
        </section>
        <section onClick={changeUser}>
          <span className='icon icon-moon'/>
          {t('sidebar.log_out')}
        </section>
      </div>
    </div>
  }
}

HubSidebar.propTypes = {
  osx: PropTypes.bool,
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
  closeTab: PropTypes.func.isRequired
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
  changeUser: () => dispatch(actions.changeUser())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubSidebar)
