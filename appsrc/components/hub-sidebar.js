
import React, {PropTypes, Component} from 'react'
import {connect} from 'react-redux'
import {map} from 'underline'
import classNames from 'classnames'

import {navigate, closeTab} from '../actions'

import Icon from './icon'

const defaultCoverUrl = 'static/images/itchio-textless-pink.svg'

export class HubSidebar extends Component {
  render () {
    const {path, tabs, navigate, closeTab} = this.props

    return <div className='hub_sidebar'>
      {this.me()}

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
    const {me} = this.props
    const {coverUrl = defaultCoverUrl, username} = me

    return <section className='me'>
      <img src={coverUrl}/>
      <span>{username}</span>
      <div className='filler'/>
      <Icon icon='triangle-down'/>
    </section>
  }
}

HubSidebar.propTypes = {
  // TODO: flesh out shape of 'me'
  me: PropTypes.object,

  path: PropTypes.string,
  tabs: PropTypes.shape({
    constant: PropTypes.array,
    transient: PropTypes.array
  }),

  navigate: PropTypes.func,
  closeTab: PropTypes.func
}

const mapStateToProps = (state) => ({
  me: state.session.credentials.me,
  path: state.session.navigation.path,
  tabs: state.session.navigation.tabs
})

const mapDispatchToProps = (dispatch) => ({
  navigate: (path) => dispatch(navigate(path)),
  closeTab: (path) => dispatch(closeTab(path))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubSidebar)
