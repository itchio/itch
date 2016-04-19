
import classNames from 'classnames'
import React, {Component, PropTypes} from 'react'

import * as actions from '../actions'
import urls from '../constants/urls'

import Icon from './icon'

import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

import {filter} from 'underline'

/**
 * Displays our current progress when checking for updates, etc.
 */
class StatusBar extends Component {
  constructor () {
    super()
    this.state = {}
  }

  render () {
    const {t, selfUpdate, offlineMode} = this.props
    const {dismissStatus, applySelfUpdateRequest, showAvailableSelfUpdate, updatePreferences} = this.props
    let {status, error, uptodate, available, downloading, downloaded, checking} = selfUpdate

    let children = []
    let active = true
    let busy = false
    let indev = false

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

    if (urls.itchio !== urls.originalItchio) {
      children = [
        ...children,
        <span> </span>,
        <Icon icon='star'/>,
        <span>{urls.itchio}</span>
      ]
      indev = true
      active = true
    }

    const classes = classNames('status-bar', {active, busy, indev})

    const plugHint = t(`status.offline_mode.${offlineMode ? 'active' : 'inactive'}`)
    const plugIcon = offlineMode ? 'globe-outline' : 'globe2'
    const plugClasses = classNames('plug hint--right', {active: offlineMode})
    const selfUpdateClasses = classNames('self-update', {busy})

    return <div className={classes}>
      <div className={selfUpdateClasses} onClick={onClick}>
        {children}
      </div>
      <div className='padder'/>

      {this.downloads()}

      {this.history()}

      <div className={plugClasses} onClick={() => updatePreferences({offlineMode: !offlineMode})} data-hint={plugHint}>
        <Icon icon={plugIcon}/>
      </div>
    </div>
  }

  componentWillReceiveProps (nextProps) {
    // such pure, much react
    if (nextProps.finishedDownloads.length > this.props.finishedDownloads.length) {
      this.setState({...this.state, downloadsBounce: true})
      setTimeout(() => this.setState({...this.state, downloadsBounce: false}), 500)
    }
    if (nextProps.historyItems.length > this.props.historyItems.length) {
      this.setState({...this.state, historyBounce: true})
      setTimeout(() => this.setState({...this.state, historyBounce: false}), 500)
    }
  }

  downloads () {
    const {t, downloadItems, finishedDownloads, navigate} = this.props

    const downloadClasses = classNames('downloads hint--right', {active: downloadItems.length > 0, bounce: this.state.downloadsBounce})
    const downloadHint = downloadItems.length === 0 ? t('status.downloads.no_active_downloads') : t('status.downloads.click_to_manage')

    return <div ref='downloads' className={downloadClasses} data-hint={downloadHint} onClick={() => navigate('downloads')}>
      <Icon icon='download'/>
      { finishedDownloads.length > 0
      ? <span className='bubble'>{finishedDownloads.length}</span>
      : '' }
    </div>
  }

  history () {
    const {t, historyItems, navigate} = this.props
    const activeItems = historyItems::filter('active')

    const historyHint = activeItems.length === 0 ? t('status.history.no_active_items') : t('status.history.click_to_expand')
    const historyClasses = classNames('history hint--right', {active: activeItems.length > 0, bounce: this.state.historyBounce})

    return <div ref='history' className={historyClasses} data-hint={historyHint} onClick={() => navigate('history')}>
      <Icon icon='history'/>
      { activeItems.length > 0
      ? <span className='bubble'>{activeItems.length}</span>
      : '' }
    </div>
  }
}

StatusBar.propTypes = {
  offlineMode: PropTypes.bool,
  historyItems: PropTypes.array,
  downloadItems: PropTypes.array,
  finishedDownloads: PropTypes.array,
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
  navigate: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  offlineMode: (state) => state.preferences.offlineMode,
  historyItems: (state) => state.history.itemsByDate,
  downloadItems: (state) => state.tasks.downloadsByOrder,
  finishedDownloads: (state) => state.tasks.finishedDownloads,
  selfUpdate: (state) => state.selfUpdate
})

const mapDispatchToProps = (dispatch) => ({
  updatePreferences: (payload) => dispatch(actions.updatePreferences(payload)),
  showAvailableSelfUpdate: () => dispatch(actions.showAvailableSelfUpdate()),
  applySelfUpdateRequest: () => dispatch(actions.applySelfUpdateRequest()),
  dismissStatus: () => dispatch(actions.dismissStatus()),
  navigate: (path) => dispatch(actions.navigate(path))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(StatusBar)
