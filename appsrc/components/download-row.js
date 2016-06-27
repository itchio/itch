
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
    const {first, item, navigateToGame} = this.props

    const {game, id} = item
    const coverUrl = game.stillCoverUrl || game.coverUrl
    const coverStyle = {}
    if (coverUrl) {
      coverStyle.backgroundImage = `url("${coverUrl}")`
    }

    const itemClasses = classNames('history-item', {first})

    return <li key={id} className={itemClasses}>
      <div className='cover' style={coverStyle} onClick={() => navigateToGame(game)}/>
      <div className='stats'>
        {this.progress()}
      </div>
      {this.controls()}
    </li>
  }

  controls () {
    const {active, first, paused, item, retry} = this.props
    const {resumeDownloads, pauseDownloads, prioritizeDownload} = this.props
    const {id, err} = item

    if (!active && err) {
      return <div className='controls'>
        <span className='icon icon-repeat' onClick={() => retry(item.downloadOpts)}></span>
      </div>
    }

    if (!active) {
      return ''
    }

    return <div className='controls'>
    {first
      ? (paused
        ? <span className='icon icon-triangle-right' onClick={resumeDownloads}/>
        : <span className='icon icon-pause' onClick={pauseDownloads}/>
      )
      : <span className='icon icon-caret-up' onClick={() => prioritizeDownload(id)}/>
    }
    </div>
  }

  progress () {
    const {t, active, item} = this.props
    const {err} = item

    if (!active) {
      if (err) {
        return <div className='error-message'>
          {t('status.downloads.download_error')}
          <div className='timeago'>
            {err.message || ('' + err)}
          </div>
        </div>
      }

      const {game} = item
      return <div>
        {game.title}
        <GameActions game={game} showSecondary/>
      </div>
    }
    const {game, date, progress = 0, reason} = item

    const progressInnerStyle = {
      width: (progress * 100) + '%'
    }
    const {dominantColor} = this.state
    if (dominantColor) {
      progressInnerStyle.backgroundColor = dominantColor
    }

    const perc = (progress * 100).toFixed(1) + '%'
    const sizeDone = item.totalSize ? humanize.fileSize(item.totalSize * (1 - progress)) : ''
    const totalSize = item.totalSize ? humanize.fileSize(item.totalSize) : t('status.downloads.unknown_size')
    const reasonText = this.reasonText(reason)

    return <div>
      <div className='progress'>
        <div className='progress-inner' style={progressInnerStyle}/>
      </div>
      {game.title} — {perc}
      {item.totalSize
      ? <span>, {sizeDone} / {totalSize}</span>
      : ''
      }
      <div className='timeago'>
        Started <NiceAgo date={date}/>
        {reasonText ? ` — ${reasonText}` : ''}
      </div>
    </div>
  }

  reasonText (reason) {
    switch (reason) {
      case 'install':
        return 'for first install'
      case 'update':
        return 'to update to the latest version'
      default:
        return 'for reasons unknown'
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
  paused: PropTypes.bool,
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

const mapStateToProps = (state) => ({})

const mapDispatchToProps = (dispatch) => ({
  navigateToGame: (game) => dispatch(actions.navigateToGame(game)),
  prioritizeDownload: (id) => dispatch(actions.prioritizeDownload(id)),
  pauseDownloads: () => dispatch(actions.pauseDownloads()),
  resumeDownloads: () => dispatch(actions.resumeDownloads()),
  retry: (downloadOpts) => dispatch(actions.retryDownload({downloadOpts}))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DownloadRow)
