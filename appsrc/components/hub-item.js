
import React, {Component, PropTypes} from 'react'
import {createStructuredSelector} from 'reselect'
import invariant from 'invariant'

import {connect} from './connect'

import * as actions from '../actions'
import GameActions from './game-actions'

export class HubItem extends Component {
  render () {
    const {game, cavesByGameId} = this.props
    const cave = cavesByGameId[game.id]
    const {title, coverUrl} = game
    const {navigateToGame} = this.props

    const platformCompatible = true
    const mayDownload = true
    const actionProps = {cave, game, platformCompatible, mayDownload}

    return <div className='hub-item' onClick={() => navigateToGame(game)}>
      <section className='cover' style={{backgroundImage: `url("${coverUrl}")`}}/>

      <section className='undercover'>
        <section className='title'>
          {title}
        </section>

        <GameActions {...actionProps}/>
      </section>
    </div>
  }

  fakeActions () {
    return <section className='actions'>
      <div className='button'>
        <span className='icon icon-checkmark'/>
        <span>Launch</span>
      </div>
      <div className='icon-button'>
      </div>
    </section>
  }
}

HubItem.propTypes = {
  game: PropTypes.shape({
    title: PropTypes.string,
    coverUrl: PropTypes.string
  }),

  cavesByGameId: PropTypes.object,
  navigateToGame: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  cavesByGameId: (state) => state.globalMarket.cavesByGameId
})

const mapDispatchToProps = (dispatch) => ({
  navigateToGame: (game) => {
    invariant(typeof game === 'object', 'game is an object')
    dispatch(actions.navigateToGame(game))
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubItem)
