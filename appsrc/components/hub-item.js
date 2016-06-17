
import React, {Component, PropTypes} from 'react'
import invariant from 'invariant'

import {connect} from './connect'

import * as actions from '../actions'
import GameActions from './game-actions'

export class HubItem extends Component {
  constructor () {
    super()
    this.state = {
      hover: false
    }
  }

  render () {
    const {game} = this.props
    const {title, coverUrl, stillCoverUrl} = game
    const {navigateToGame} = this.props

    let gif
    const coverStyle = {}
    if (coverUrl) {
      if (this.state.hover) {
        coverStyle.backgroundImage = `url('${coverUrl}')`
      } else {
        if (stillCoverUrl) {
          if (/.gif$/i.test(coverUrl)) {
            gif = true
          }
          coverStyle.backgroundImage = `url('${stillCoverUrl}')`
        } else {
          coverStyle.backgroundImage = `url('${coverUrl}')`
        }
      }
    }

    const actionProps = {game, showSecondary: true}

    return <div className='hub-item' onMouseEnter={::this.onMouseEnter} onMouseLeave={::this.onMouseLeave}>
      {gif
        ? <span className='gif-marker'>gif</span>
        : ''
      }
      <section className='cover' style={coverStyle} onClick={() => navigateToGame(game)}/>

      <section className='undercover'>
        <section className='title'>
          {title}
        </section>

        {false ? <GameActions {...actionProps}/> : ''}
      </section>
    </div>
  }

  onMouseEnter () {
    this.setState({hover: true})
  }

  onMouseLeave () {
    this.setState({hover: false})
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
