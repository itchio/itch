
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

import HubSearchResults from './hub-search-results'
import HubItem from './hub-item'
import HubGhostItem from './hub-ghost-item'

import Downloads from './downloads'
import History from './history'

import {each, map, indexBy, where} from 'underline'

export class HubMeat extends Component {
  render () {
    const {path, me, games, downloadKeys} = this.props

    let child = ''

    if (path === 'featured') {
      child = <div className='hub-grid'>You'd like some featured content wouldn't you?</div>
    } else if (path === 'dashboard') {
      child = this.gameGrid(games::where({userId: me.id}))
    } else if (path === 'library') {
      child = this.gameGrid(downloadKeys::map((key) => games[key.gameId])::indexBy('id'))
    } else if (path === 'downloads') {
      child = <Downloads/>
    } else if (path === 'history') {
      child = <History/>
    }

    return <div className='hub-meat'>
      {child}
      <HubSearchResults/>
    </div>
  }

  gameGrid (games) {
    const items = []

    games::each((game, id) => {
      items.push(<HubItem key={`game-${id}`} game={game}/>)
    })

    let ghostId = 0
    for (let i = 0; i < 12; i++) {
      items.push(<HubGhostItem key={`ghost-${ghostId++}`}/>)
    }

    return <div className='hub-grid'>
      {items}
    </div>
  }
}

HubMeat.propTypes = {
  path: PropTypes.string,
  me: PropTypes.object,
  games: PropTypes.object,
  downloadKeys: PropTypes.object
}

const mapStateToProps = (state) => ({
  path: state.session.navigation.path,
  me: state.session.credentials.me,
  games: state.market.games,
  downloadKeys: state.market.downloadKeys
})
const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubMeat)
