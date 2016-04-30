
import {createSelector, createStructuredSelector} from 'reselect'
import React, {PropTypes, Component} from 'react'
import classNames from 'classnames'
import {connect} from './connect'

import BrowserControls from './browser-controls'
import {pathToId} from '../util/navigation'

export class UserBrowserBar extends Component {
  render () {
    const {browserState} = this.props
    const {loading} = browserState
    const barClasses = classNames('browser-bar', 'user-browser-bar', {loading})

    return <div className={barClasses}>
      <div className='controls'>
        <BrowserControls {...this.props}/>
      </div>
    </div>
  }
}

UserBrowserBar.propTypes = {
  user: PropTypes.object
}

const mapStateToProps = (state, props) => {
  const marketSelector = createStructuredSelector({
    userId: (state, props) => +pathToId(props.tabPath),
    userMarket: (state, props) => state.session.market,
    tabData: (state, props) => props.tabData
  })

  const userSelector = createSelector(
    marketSelector,
    (cs) => {
      const getUser = (market) => ((market || {}).users || {})[cs.userId]
      const user = getUser(cs.userMarket) || getUser(cs.tabData)
      return {user}
    }
  )
  return userSelector
}

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserBrowserBar)
