
import React, {Component, PropTypes} from 'react'
import {connect} from './connect'

import {pathToIcon} from '../util/navigation'

class HubBreadDescription extends Component {
  render () {
    const {t, path, tabData} = this.props
    const {icon = pathToIcon(path), label = 'Loading...', subtitle} = tabData[path] || {}

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
  tabData: PropTypes.object,

  t: PropTypes.func.isRequired
}

const mapStateToProps = (state) => ({
  path: state.session.navigation.path,
  tabData: state.session.navigation.tabData,
  market: state.market
})

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubBreadDescription)
