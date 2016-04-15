
import React, {Component, PropTypes} from 'react'
import {connect} from './connect'
import getDominantColor from './get-dominant-color'
import humanize from 'humanize-plus'

import defaultImages from '../constants/default-images'
import * as actions from '../actions'

import TimeAgo from 'react-timeago'

class DownloadRow extends Component {
  constructor () {
    super()
    this.state = {}
  }

  render () {
    const {item, navigateToGame} = this.props

    const {game, upload, date, id, progress = 0, paused, reason} = item
    const coverUrl = game.coverUrl || defaultImages.thumbnail
    const coverStyle = {backgroundImage: `url("${coverUrl}")`}
    const progressInnerStyle = {
      width: (progress * 100) + '%'
    }
    const {dominantColor} = this.state
    if (dominantColor) {
      progressInnerStyle.backgroundColor = dominantColor
    }

    const reasonText = this.reasonText(reason)

    return <li key={id} className='history-item'>
      <div className='cover' style={coverStyle} onClick={() => navigateToGame(game)}/>
      <div className='stats'>
        <div className='progress'>
          <div className='progress-inner' style={progressInnerStyle}/>
        </div>
        {(progress * 100).toFixed(1)}% done, {humanize.fileSize(upload.size * (1 - progress))} left
        <div className='timeago'>
          Started <TimeAgo date={date}/> {reasonText ? ` — ${reasonText}` : ''}
        </div>
      </div>
      <div className='controls'>
        { paused
          ? <span className='icon icon-triangle-right'/>
          : <span className='icon icon-pause'/> }
      </div>
    </li>
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
  item: PropTypes.shape({
    upload: PropTypes.object
  }),

  t: PropTypes.func.isRequired,
  navigateToGame: PropTypes.func.isRequired
}

const mapStateToProps = (state) => ({})

const mapDispatchToProps = (dispatch) => ({
  navigateToGame: (game) => dispatch(actions.navigateToGame(game))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DownloadRow)
