
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'
import classNames from 'classnames'

import GameGrid from './game-grid'
import CollectionGrid from './collection-grid'
import {map} from 'underline'

export class Dashboard extends Component {
  render () {
    const {t, allGames, collections, myGameIds} = this.props

    const games = myGameIds::map((id) => allGames[id])

    let sectionCount = 0
    if (games.length > 0) {
      sectionCount++
    }
    if (Object.keys(collections).length > 0) {
      sectionCount++
    }

    const showHeaders = (sectionCount > 1)
    const headerClasses = classNames('', {shown: showHeaders})

    return <div className='dashboard-meat'>
      <h2 className={headerClasses}>{t('sidebar.dashboard')}</h2>
      <GameGrid games={games}/>

      <h2 className={headerClasses}>{t('sidebar.collections')}</h2>
      <CollectionGrid collections={collections}/>
    </div>
  }
}

Dashboard.propTypes = {
  // derived
  allGames: PropTypes.object,
  myGameIds: PropTypes.array,
  collections: PropTypes.object,

  t: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  allGames: (state) => state.market.games,
  myGameIds: (state) => (((state.market.itchAppProfile || {}).myGames || {}).ids || []),
  collections: (state) => state.market.collections || {}
})

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Dashboard)
