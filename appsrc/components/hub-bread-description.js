
import React, {Component, PropTypes} from 'react'
import {findWhere} from 'underline'

import {connect} from './connect'
import {pathToId} from '../util/navigation'

class HubBreadDescription extends Component {
  render () {
    // TODO: i18n
    // TODO: reselect that
    const {t, path, tabs, market} = this.props
    const {collections, games, users} = market

    const allTabs = tabs.constant.concat(tabs.transient)
    const tab = allTabs::findWhere({path}) || {label: '?', icon: 'neutral'}

    const {icon, label} = tab

    let subtitle = ''
    if (/^collections/.test(path)) {
      const collection = collections[pathToId(path)]
      const user = users[collection.userId]
      subtitle = `${collection.shortText}`
      if (user) {
        subtitle += ` | a collection by ${user.displayName}`
      }
    } else if (/^games/.test(path)) {
      const game = games[pathToId(path)]
      const user = users[game.userId]
      subtitle = `${game.shortText}`
      if (user) {
        subtitle += ` | a ${game.classification} by ${user.displayName}`
      }
    } else if (/^search/.test(path)) {
      subtitle = `We need to improve search, your mileage may vary`
    } else if (path === 'featured') {
      subtitle = 'Curated with love by the itch.io team'
    } else if (path === 'dashboard') {
      subtitle = 'Things you make and break'
    } else if (path === 'library') {
      subtitle = 'Things you gave money to'
    } else if (path === 'preferences') {
      subtitle = 'Nuts and bolts'
    } else if (path === 'downloads') {
      subtitle = 'Swooooooosh'
    } else if (path === 'history') {
      subtitle = 'Here\'s what happened recently'
    }

    return <section className='description'>
      <h2><icon className={`icon icon-${icon}`}/> {t.format(label)}</h2>
      <h3>{t.format(subtitle)}</h3>
    </section>
  }
}

HubBreadDescription.propTypes = {
  path: PropTypes.string,
  tabs: PropTypes.shape({
    constant: PropTypes.array,
    transient: PropTypes.array
  }),
  market: PropTypes.object,

  t: PropTypes.func.isRequired
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
