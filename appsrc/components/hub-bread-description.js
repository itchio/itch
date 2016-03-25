
import React, {Component, PropTypes} from 'react'
import {findWhere} from 'underline'

import {connect} from './connect'

const ID_RE = /\/(.+)$/
function pathToId (path) {
  return ID_RE.exec(path)[1]
}

class HubBreadDescription extends Component {
  render () {
    // TODO: reselect that
    const {path, tabs, market} = this.props
    const {collections, games, users} = market

    const allTabs = tabs.constant.concat(tabs.transient)
    const tab = allTabs::findWhere({path}) || {label: '?', icon: 'neutral'}

    const {icon, label} = tab

    let subtitle = ''
    if (/collections/.test(path)) {
      const collection = collections[pathToId(path)]
      const user = users[collection.userId]
      subtitle = `${collection.shortText}`
      if (user) {
        subtitle += ` | a collection by ${user.displayName}`
      }
    } else if (/games/.test(path)) {
      const game = games[pathToId(path)]
      const user = users[game.userId]
      subtitle = `${game.shortText}`
      if (user) {
        subtitle += ` | a ${game.classification} by ${user.displayName}`
      }
    } else if (path === 'featured') {
      subtitle = 'Curated with love by the itch.io team'
    } else if (path === 'dashboard') {
      subtitle = 'Things you make and break'
    } else if (path === 'library') {
      subtitle = 'Things you gave money to'
    }

    return <section className='description'>
      <h2><icon className={`icon icon-${icon}`}/> {label}</h2>
      <h3>{subtitle}</h3>
    </section>
  }
}

HubBreadDescription.propTypes = {
  path: PropTypes.string,
  tabs: PropTypes.shape({
    constant: PropTypes.array,
    transient: PropTypes.array
  }),
  market: PropTypes.object
}

const mapStateToProps = (state) => ({
  path: state.session.navigation.path,
  tabs: state.session.navigation.tabs,
  market: state.market
})

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubBreadDescription)
