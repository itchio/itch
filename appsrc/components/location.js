
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

import path from 'path'

import GameGrid from './game-grid'
import {map, filter} from 'underline'

export class Location extends Component {
  render () {
    const {t, locationName, userDataPath, locations, caves, allGames} = this.props

    const isAppData = (locationName === 'appdata')
    let location = locations[locationName]
    if (!location) {
      if (locationName === 'appdata') {
        location = {
          name: 'appdata',
          path: path.join(userDataPath, 'apps')
        }
      }
    }

    const locCaves = caves::filter((cave) => cave.installLocation === locationName || (isAppData && !cave.installLocation))
    const locationGames = locCaves::map((key) => allGames[key.gameId])::filter((x) => !!x)

    return <div className='location-meat'>
      {locationGames.length > 0
        ? <GameGrid games={locationGames}/>
        : <p className='empty'>{t('install_location.empty')}</p>
      }
    </div>
  }
}

Location.propTypes = {
  // specified
  locationName: PropTypes.string,

  // derived
  userDataPath: PropTypes.string,
  locations: PropTypes.object,
  caves: PropTypes.object,
  allGames: PropTypes.object,
  downloadKeys: PropTypes.object,

  t: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  caves: (state) => state.globalMarket.caves || {},
  allGames: (state) => state.market.games || {},
  locations: (state) => state.preferences.installLocations,
  userDataPath: (state) => state.system.userDataPath
})

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Location)
