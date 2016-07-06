
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'
import classNames from 'classnames'

import urls from '../constants/urls'
import * as actions from '../actions'

import GameGrid from './game-grid'
import GameGridFilters from './game-grid-filters'
import {map} from 'underline'

export class Dashboard extends Component {
  render () {
    const {t, allGames, myGameIds, navigate} = this.props

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
      <GameGridFilters tab={tab}>
        <span className='link' onClick={(e) => navigate(`url/${urls.dashboard}`)}>
          {t('outlinks.open_dashboard')}
        </span>
      </GameGridFilters>
      <GameGrid tab={tab} games={games}/>
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

const mapDispatchToProps = (dispatch) => ({
  navigate: (url) => dispatch(actions.navigate(url))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Dashboard)
