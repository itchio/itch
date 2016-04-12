
import {createSelector, createStructuredSelector} from 'reselect'
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

import Loader from './loader'
import BrowserMeat from './browser-meat'

export class UserMeat extends Component {
  render () {
    const {user, path} = this.props

    if (!user) {
      return <Loader/>
    }

    const browserProps = {}
    return <BrowserMeat className='user-meat' path={path} url={user.url} {...browserProps}/>
  }
}

UserMeat.propTypes = {
  path: PropTypes.string.isRequired,
  userId: PropTypes.number,
  user: PropTypes.object
}

const mapStateToProps = (state, props) => {
  const marketSelector = createStructuredSelector({
    userId: (state, props) => props.userId,
    tab: (state, props) => {
      const path = `games/${props.userId}`
      return state.session.navigation.tabData[path]
    },
    user: (state) => state.session.market
  })

  const userSelector = createSelector(
    marketSelector,
    (componentState) => {
      const {userId} = componentState

      const getUser = (market) => ((market || {}).users || {})[userId]
      const game = getUser(componentState.user) || getUser(componentState.tab)
      return {game}
    }
  )
  return userSelector
}

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserMeat)
