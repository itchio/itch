
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'
import classNames from 'classnames'

import GameGrid from './game-grid'
import GameGridFilters from './game-grid-filters'
import {map} from 'underline'

import EnhanceFiltered from './filtered'

export class Dashboard extends Component {
  render () {
    const {t, allGames, myGameIds, query} = this.props

    const games = myGameIds::map((id) => allGames[id])

    let sectionCount = 0
    if (games.length > 0) {
      sectionCount++
    }

    const showHeaders = (sectionCount > 1)
    const headerClasses = classNames('', {shown: showHeaders})

    const tab = 'dashboard'

    return <div className='dashboard-meat'>
      <h2 className={headerClasses}>{t('sidebar.dashboard')}</h2>
      <GameGridFilters tab={tab}/>
      <GameGrid tab={tab} games={games} query={query}/>
    </div>
  }
}

Dashboard.propTypes = {
  // derived
  allGames: PropTypes.object,
  myGameIds: PropTypes.array,

  t: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  allGames: (state) => state.market.games,
  myGameIds: (state) => (((state.market.itchAppProfile || {}).myGames || {}).ids || [])
})

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EnhanceFiltered(Dashboard))
