
import classNames from 'classnames'
import React, {Component, PropTypes} from 'react'

import * as actions from '../actions'

import Icon from './icon'

import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

/**
 * Displays our current progress when checking for updates, etc.
 */
class StatusBar extends Component {
  render () {
    const {t, selfUpdate, offlineMode} = this.props
    const {dismissStatus, applySelfUpdateRequest, showAvailableSelfUpdate} = this.props
    let {status, error, uptodate, available, downloading, downloaded, checking} = selfUpdate

    let children = []
    let active = true
    let busy = false

    let onClick = () => null

    if (status) {
      onClick = dismissStatus
      children = [
        <Icon icon='heart-filled'/>,
        <span>{status}</span>,
        <Icon icon='cross'/>
      ]
    } else if (error) {
      onClick = dismissStatus
      children = [
        <Icon icon='heart-broken'/>,
        <span>Update error: {error}</span>,
        <Icon icon='cross'/>
      ]
    } else if (downloaded) {
      onClick = applySelfUpdateRequest
      children = [
        <Icon icon='install'/>,
        <span>{t('status.downloaded')}</span>
      ]
    } else if (downloading) {
      busy = true
      children = [
        <Icon icon='download'/>,
        <span>{t('status.downloading')}</span>
      ]
    } else if (available) {
      onClick = showAvailableSelfUpdate
      children = [
        <Icon icon='earth'/>,
        <span>{t('status.available')}</span>
      ]
    } else if (checking) {
      busy = true
      children = [
        <Icon icon='stopwatch'/>,
        <span>{t('status.checking')}</span>
      ]
    } else if (uptodate) {
      children = [
        <Icon icon='like'/>,
        <span>{t('status.uptodate')}</span>
      ]
    } else {
      active = false
    }

    const classes = classNames('status-bar', {active, busy})
    const plugHint = t(`status.offline_mode.${offlineMode ? 'active' : 'inactive'}`)
    const plugClasses = classNames('plug', {active: offlineMode})

    return <div className={classes}>
      <div className={plugClasses}>
        <div className='hint--right' data-hint={plugHint}>
          <Icon icon='moon'/>
        </div>
      </div>
      <div className='padder'/>
      <div className='message' onClick={onClick}>
      {children}
      </div>
    </div>
  }
}

StatusBar.propTypes = {
  offlineMode: false,
  selfUpdate: PropTypes.shape({
    status: PropTypes.string,
    error: PropTypes.string,

    available: PropTypes.object,
    downloading: PropTypes.object,
    checking: PropTypes.bool,
    uptodate: PropTypes.bool
  }),

  t: PropTypes.func.isRequired,
  applySelfUpdateRequest: PropTypes.func.isRequired,
  showAvailableSelfUpdate: PropTypes.func.isRequired,
  dismissStatus: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  selfUpdate: (state) => state.selfUpdate
})

const mapDispatchToProps = (dispatch) => ({
  showAvailableSelfUpdate: () => dispatch(actions.showAvailableSelfUpdate()),
  applySelfUpdateRequest: () => dispatch(actions.applySelfUpdateRequest()),
  dismissStatus: () => dispatch(actions.dismissStatus())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(StatusBar)
