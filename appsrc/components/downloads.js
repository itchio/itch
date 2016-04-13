
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
    const {items} = this.props

    return <ul className='downloads-page'>
    {items::map((item) =>
      <DownloadRow key={item.id} item={item}/>
    )}
    </ul>
  }
}

Downloads.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    upload: PropTypes.object
  })),

  t: PropTypes.func.isRequired,
  navigateToGame: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  items: (state) => state.tasks.downloadsByDate
})

const mapDispatchToProps = (dispatch) => ({
  navigateToGame: (game) => dispatch(actions.navigateToGame(game))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Downloads)
