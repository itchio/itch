
import React, {Component, PropTypes} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

import {map} from 'underline'
import * as actions from '../actions'

import DownloadRow from './download-row'

class Downloads extends Component {
  constructor () {
    super()
    this.state = {}
  }

  render () {
    const {t, items, finishedItems, paused} = this.props
    const {clearFinishedDownloads} = this.props

    const hasItems = (items.length + finishedItems.length) > 0
    if (!hasItems) {
      return <ul className='downloads-page'>
        <li className='empty'>
          {t('status.downloads.no_active_downloads')}
        </li>
      </ul>
    }

    return <ul className='downloads-page'>
    {items::map((item, i) =>
      <DownloadRow key={item.id} item={item} first={i === 0} paused={paused} active/>
    )}
    {finishedItems.length > 0
      ? [
        <div className='section-bar'>
          <h2 className='finished-header'>
            {t('status.downloads.category.finished')}
          </h2>
          <span className='clear hint--top' data-hint={t('status.downloads.clear_all_finished')} onClick={clearFinishedDownloads}>
            <span className='icon icon-delete'/>
          </span>
        </div>
      ].concat(finishedItems::map((item) =>
        <DownloadRow key={item.id} item={item}/>
      ))
      : ''}

    </ul>
  }
}

const arrayOfUploads = PropTypes.arrayOf(PropTypes.shape({
  upload: PropTypes.object
}))

Downloads.propTypes = {
  items: arrayOfUploads,
  finishedItems: arrayOfUploads,
  paused: PropTypes.bool,

  t: PropTypes.func.isRequired,
  navigateToGame: PropTypes.func.isRequired,
  clearFinishedDownloads: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  items: (state) => state.downloads.downloadsByOrder::map((id) => state.downloads.downloads[id]),
  finishedItems: (state) => state.downloads.finishedDownloads::map((id) => state.downloads.downloads[id]),
  paused: (state) => state.downloads.downloadsPaused
})

const mapDispatchToProps = (dispatch) => ({
  navigateToGame: (game) => dispatch(actions.navigateToGame(game)),
  clearFinishedDownloads: () => dispatch(actions.clearFinishedDownloads())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Downloads)
