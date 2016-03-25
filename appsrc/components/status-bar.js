
import classNames from 'classnames'
import React, {Component, PropTypes} from 'react'

import * as actions from '../actions'
import TimeAgo from 'react-timeago'

import Icon from './icon'

import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

import {filter} from 'underline'

/**
 * Displays our current progress when checking for updates, etc.
 */
class StatusBar extends Component {
  render () {
    const {t, selfUpdate, offlineMode} = this.props
    const {dismissStatus, applySelfUpdateRequest, showAvailableSelfUpdate, updatePreferences} = this.props
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
    const plugIcon = offlineMode ? 'globe-outline' : 'globe2'
    const plugClasses = classNames('plug hint--right', {active: offlineMode})
    const selfUpdateClasses = classNames('self-update', {busy})

    return <div className={classes}>
      <div className={selfUpdateClasses} onClick={onClick}>
        {children}
      </div>
      <div className='padder'/>

      {this.history()}

      <div className={plugClasses} onClick={() => updatePreferences({offlineMode: !offlineMode})} data-hint={plugHint}>
        <Icon icon={plugIcon}/>
      </div>
    </div>
  }

  history () {
    const {t, historyItems, historyRead} = this.props
    const activeItems = historyItems::filter('active')

    const mostRecentItem = activeItems[0]
    const historyHint = activeItems.length > 0 ? t('status.history.no_active_items') : t('status.history.no_active_items')
    const historyIcon = 'history'
    const historyClasses = classNames('history hint--right', {active: activeItems.length > 0})

    return <div className={historyClasses} data-hint={historyHint} onClick={() => historyRead()}>
      <Icon icon={historyIcon}/>
      { activeItems.length > 0
      ? [
        <span className='bubble'>{activeItems.length}</span>,
        <span>
          {t.apply(null, mostRecentItem.label).substring(0, 30) + '...'}
          <span className='timeago'>
            <TimeAgo date={mostRecentItem.date}/>
          </span>
        </span>
      ]
      : '' }
    </div>
  }
}

StatusBar.propTypes = {
  offlineMode: PropTypes.bool,
  historyItems: PropTypes.object,
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
  dismissStatus: PropTypes.func.isRequired,
  updatePreferences: PropTypes.func.isRequired,
  historyRead: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  offlineMode: (state) => state.preferences.offlineMode,
  historyItems: (state) => state.history.itemsByDate,
  selfUpdate: (state) => state.selfUpdate
})

const mapDispatchToProps = (dispatch) => ({
  updatePreferences: (payload) => dispatch(actions.updatePreferences(payload)),
  showAvailableSelfUpdate: () => dispatch(actions.showAvailableSelfUpdate()),
  applySelfUpdateRequest: () => dispatch(actions.applySelfUpdateRequest()),
  dismissStatus: () => dispatch(actions.dismissStatus()),
  historyRead: () => dispatch(actions.historyRead())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(StatusBar)
