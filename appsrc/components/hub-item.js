
import React, {Component, PropTypes} from 'react'
import invariant from 'invariant'

import {connect} from './connect'

import * as actions from '../actions'
import GameActions from './game-actions'

export class HubItem extends Component {
  render () {
    const {game} = this.props
    const {title, coverUrl} = game
    const {navigateToGame} = this.props

    const actionProps = {game, showSecondary: true}
    const coverStyle = {}
    if (coverUrl) {
      coverStyle.backgroundImage = `url("${coverUrl}")`
    }

    return <div className='hub-item'>
      <section className='cover' style={coverStyle} onClick={() => navigateToGame(game)}/>

      <section className='undercover'>
        <section className='title'>
          {title}
        </section>

        <GameActions {...actionProps}/>
      </section>
    </div>
  }
}

HubItem.propTypes = {
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
)(HubItem)
