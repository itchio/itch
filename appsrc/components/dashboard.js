
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

import GameGrid from './game-grid'
import {map} from 'underline'

export class Dashboard extends Component {
  render () {
    const {allGames, myGameIds} = this.props

    const games = myGameIds::map((id) => allGames[id])
    return <GameGrid games={games}/>
  }
}

Dashboard.propTypes = {
  // derived
  allGames: PropTypes.object,
  myGameIds: PropTypes.array
}

const mapStateToProps = createStructuredSelector({
  allGames: (state) => state.market.games,
  myGameIds: (state) => (((state.market.itchAppProfile || {}).myGames || {}).ids || [])
})

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Dashboard)
