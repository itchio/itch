
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'
import classNames from 'classnames'

import GameGrid from './game-grid'
import {map, filter, indexBy} from 'underline'

export class Library extends Component {
  render () {
    const {t, caves, allGames, downloadKeys} = this.props

    const installedGames = caves::map((key) => allGames[key.gameId])::filter((x) => !!x)
    const installedGamesById = installedGames::indexBy('id')

    const games = downloadKeys::map((key) => allGames[key.gameId])::filter((x) => !installedGamesById[x.id])

    let sectionCount = 0
    if (installedGames.length > 0) {
      sectionCount++
    }
    if (games.length > 0) {
      sectionCount++
    }

    const showHeaders = (sectionCount > 1)
    const headerClasses = classNames('', {shown: showHeaders})

    return <div className='library-meat'>
      <h2 className={headerClasses}>{t('sidebar.installed')}</h2>
      { installedGames.length > 0
        ? <GameGrid games={installedGames}/>
        : ''
      }

      <h2 className={headerClasses}>{t('sidebar.owned')}</h2>
      { games.length > 0
        ? <GameGrid games={games}/>
        : ''
      }
    </div>
  }
}

Library.propTypes = {
  // derived
  caves: PropTypes.object,
  allGames: PropTypes.object,
  downloadKeys: PropTypes.object,

  t: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  caves: (state) => state.globalMarket.caves || {},
  allGames: (state) => state.market.games || {},
  downloadKeys: (state) => state.market.downloadKeys || {}
})

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Library)
