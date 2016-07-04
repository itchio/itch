
import React, {Component, PropTypes} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

import {map, first, rest} from 'underline'
import * as actions from '../actions'

import DownloadRow from './download-row'

class Downloads extends Component {
  constructor () {
    super()
    this.state = {}
  }

  render () {
    const {t, items, finishedItems} = this.props
    const {clearFinishedDownloads} = this.props

    const hasItems = (items.length + finishedItems.length) > 0
    if (!hasItems) {
      return <p className='empty'>
          {t('status.downloads.no_active_downloads')}
      </p>
    }

    const firstItem = items::first()
    const queuedItems = items::rest()

    return <ul className='downloads-page'>

    {firstItem
    ? <div className='section-bar'>
      <h2>{t('status.downloads.category.active')}</h2>
    </div>
    : ''}

    {firstItem
    ? <DownloadRow key={firstItem.id} item={firstItem} first active/>
    : ''}

    {queuedItems.length > 0
    ? <div className='section-bar'>
      <h2>{t('status.downloads.category.queued')}</h2>
    </div>
    : ''}
    {queuedItems.length > 0
    ? queuedItems::map((item, i) =>
      <DownloadRow key={item.id} item={item} active/>
    )
    : ''}

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

  t: PropTypes.func.isRequired,
  navigateToGame: PropTypes.func.isRequired,
  clearFinishedDownloads: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  items: (state) => state.downloads.downloadsByOrder::map((id) => state.downloads.downloads[id]),
  finishedItems: (state) => state.downloads.finishedDownloads::map((id) => state.downloads.downloads[id])
})

const mapDispatchToProps = (dispatch) => ({
  navigateToGame: (game) => dispatch(actions.navigateToGame(game)),
  clearFinishedDownloads: () => dispatch(actions.clearFinishedDownloads())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Downloads)
