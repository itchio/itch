
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
    const {items, paused} = this.props

    return <ul className='downloads-page'>
    {items::map((item, i) =>
      <DownloadRow key={item.id} item={item} first={i === 0} paused={paused}/>
    )}
    </ul>
  }
}

Downloads.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    upload: PropTypes.object
  })),
  paused: PropTypes.bool,

  t: PropTypes.func.isRequired,
  navigateToGame: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  items: (state) => state.tasks.downloadsByOrder::map((id) => state.tasks.downloads[id]),
  paused: (state) => state.tasks.downloadsPaused,
  finishedItems: (state) => state.tasks.finishedDownloads
})

const mapDispatchToProps = (dispatch) => ({
  navigateToGame: (game) => dispatch(actions.navigateToGame(game)),
  clearFinishedDownloads: () => dispatch(actions.clearFinishedDownloads())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Downloads)
