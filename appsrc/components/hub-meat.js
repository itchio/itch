
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

import HubSearchResults from './hub-search-results'
import HubItem from './hub-item'
import HubGhostItem from './hub-ghost-item'

import {each} from 'underline'

export class HubMeat extends Component {
  render () {
    return <div className='hub-meat'>
      {this.fakeGrid()}
      <HubSearchResults/>
    </div>
  }

  fakeGrid () {
    const {games} = this.props
    const items = []
    let id = 0

    games::each((game, id) => {
      items.push(<HubItem key={id} game={game}/>)
    })

    for (let i = 0; i < 12; i++) {
      items.push(<HubGhostItem key={id++}/>)
    }

    return <div className='hub-grid'>
      {items}
    </div>
  }
}

HubMeat.propTypes = {
  games: PropTypes.object
}

const mapStateToProps = (state) => ({
  games: state.market.games
})
const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubMeat)
