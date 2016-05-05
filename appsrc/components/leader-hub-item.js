
import React, {Component, PropTypes} from 'react'
import invariant from 'invariant'

import {connect} from './connect'

import * as actions from '../actions'
import GameActions from './game-actions'
import GameStats from './game-stats'

export class LeaderHubItem extends Component {
  render () {
    const {game} = this.props
    const {title, shortText, coverUrl} = game
    const {navigateToGame} = this.props

    const actionProps = {game, showSecondary: true}

    const coverStyle = {
      backgroundImage: `url("${coverUrl}")`
    }

    return <div className='hub-item leader'>
      <div className='cover' style={coverStyle} onClick={() => navigateToGame(game)}/>

      <section className='description' onClick={() => navigateToGame(game)}>
        <div className='description-content'>
          <section className='title'>
            {title}
          </section>

          <section className='short-text'>
            {shortText}
          </section>
        </div>
      </section>

      <GameStats game={game} mdash={false}/>
      <GameActions {...actionProps} showSecondary={false}/>
    </div>
  }
}

LeaderHubItem.propTypes = {
  game: PropTypes.shape({
    title: PropTypes.string,
    coverUrl: PropTypes.string
  }),

  navigateToGame: PropTypes.func.isRequired
}

const mapStateToProps = (state) => ({})

const mapDispatchToProps = (dispatch) => ({
  navigateToGame: (game) => {
    invariant(typeof game === 'object', 'game is an object')
    dispatch(actions.navigateToGame(game))
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LeaderHubItem)
