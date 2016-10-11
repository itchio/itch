
import moment from 'moment'
import React, {Component, PropTypes} from 'react'
import classNames from 'classnames'
import {connect} from './connect'
import getDominantColor from './get-dominant-color'
import humanize from 'humanize-plus'

import * as actions from '../actions'

import NiceAgo from './nice-ago'
import GameActions from './game-actions'

class DownloadRow extends Component {
  constructor () {
    super()
    this.state = {}
  }

  render () {
    const {first, active, item, navigateToGame} = this.props

    const {game, id} = item
    const coverUrl = game.stillCoverUrl || game.coverUrl
    const coverStyle = {}
    if (coverUrl) {
      coverStyle.backgroundImage = `url("${coverUrl}")`
    }

    let onStatsClick = () => {}
    if (!active) {
      onStatsClick = () => navigateToGame(game)
    }

    const itemClasses = classNames('history-item', {first, dimmed: (active && !first), finished: !active})

    return <li key={id} className={itemClasses}>
      <div className='cover' style={coverStyle} onClick={() => navigateToGame(game)}/>
      <div className='stats' onClick={onStatsClick}>
        {this.progress()}
      </div>
      {this.controls()}
    </li>
  }

  controls () {
    const {t, active, first, item, retry, downloadsPaused} = this.props
    const {resumeDownloads, pauseDownloads, prioritizeDownload, cancelDownload} = this.props
    const {id, err} = item

    if (!active && err) {
      return <div className='controls'>
        <span className='icon icon-repeat' onClick={() => retry(item.downloadOpts)}></span>
      </div>
    }

    if (!active) {
      return <div className='controls'>
        <span className='hint--left' data-hint={t('status.downloads.clear_finished')}>
          <span className='icon icon-delete' onClick={() => cancelDownload(id)}/>
        </span>
      </div>
    }

    return <div className='controls'>
    {first
      ? (downloadsPaused
        ? <span className='icon icon-triangle-right' onClick={resumeDownloads}/>
        : <span className='icon icon-pause' onClick={pauseDownloads}/>
      )
      : <span className='hint--left' data-hint={t('grid.item.prioritize_download')}>
        <span className='icon icon-caret-up' onClick={() => prioritizeDownload(id)}/>
      </span>
    }
      <span className='hint--left' data-hint={t('grid.item.cancel_download')}>
        <span className='icon icon-cross' onClick={() => cancelDownload(id)}/>
      </span>
    </div>
  }

  progress () {
    const {t, first, active, item, downloadsPaused, tasksByGameId} = this.props
    const {err} = item

    const {game} = item
    const task = (tasksByGameId[game.id] || [])[0]

    if (!active && !task) {
      if (err) {
        return <div className='error-message'>
          {t('status.downloads.download_error')}
          <div className='timeago'>
            {err.message || ('' + err)}
          </div>
        </div>
      }

      return <div>
        {game.title}
        <GameActions game={game}/>
      </div>
    }

    const {date, reason} = item
    let {progress = 0, bps, eta} = item

    if (task) {
      progress = task.progress
      bps = task.bps
      eta = task.eta
    }

    const progressInnerStyle = {
      width: (progress * 100) + '%'
    }
    const {dominantColor} = this.state
    if (dominantColor) {
      progressInnerStyle.backgroundColor = dominantColor
    }

    const reasonText = this.reasonText(reason)

    return <div className='stats-inner'>
      <div className='game-title'>{game.title}</div>
      <div className='progress'>
        <div className='progress-inner' style={progressInnerStyle}/>
      </div>
      <div className='timeago'>
      {task
      ? (task.name === 'launch'
        ? t('grid.item.running')
        : t('grid.item.installing')
      )
      : (first
      ? <div>
        {t('download.started')} <NiceAgo date={date}/>
        {reasonText ? ` — ${reasonText}` : ''}
      </div>
      : t('grid.item.queued')
      )}
        <div className='filler'/>
        <div>
        {downloadsPaused
        ? <div className='paused'>{t('grid.item.downloads_paused')}</div>
        : (((active || task) && eta && bps)
          ? <span>{humanize.fileSize(bps)}/s — {moment.duration(eta, 'seconds').locale(t.lang).humanize()}</span>
          : ''
        )}
        </div>
      </div>
    </div>
  }

  reasonText (reason) {
    const {t} = this.props

    switch (reason) {
      case 'update':
        return t('download.reason.update')
      default:
        return ''
    }
  }

  componentDidMount () {
    const {item} = this.props
    const {game} = item
    const {coverUrl} = game

    getDominantColor(coverUrl, (palette) => {
      this.setState({dominantColor: getDominantColor.toCSS(getDominantColor.pick(palette))})
    })
  }
}

DownloadRow.propTypes = {
  first: PropTypes.bool,
  active: PropTypes.bool,
  item: PropTypes.shape({
    upload: PropTypes.object
  }),

  t: PropTypes.func.isRequired,
  err: PropTypes.any,
  navigateToGame: PropTypes.func.isRequired,
  prioritizeDownload: PropTypes.func.isRequired,
  pauseDownloads: PropTypes.func.isRequired,
  resumeDownloads: PropTypes.func.isRequired,
  retry: PropTypes.func.isRequired
}

const mapStateToProps = (state) => ({
  downloadsPaused: state.downloads.downloadsPaused,
  tasksByGameId: state.tasks.tasksByGameId
})

const mapDispatchToProps = (dispatch) => ({
  navigateToGame: (game) => dispatch(actions.navigateToGame(game)),
  prioritizeDownload: (id) => dispatch(actions.prioritizeDownload({id})),
  cancelDownload: (id) => dispatch(actions.cancelDownload({id})),
  pauseDownloads: () => dispatch(actions.pauseDownloads()),
  resumeDownloads: () => dispatch(actions.resumeDownloads()),
  retry: (downloadOpts) => dispatch(actions.retryDownload({downloadOpts}))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DownloadRow)
