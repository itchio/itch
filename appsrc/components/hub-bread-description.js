
import React, {Component, PropTypes} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

import {makeLabel} from '../util/navigation'

class HubBreadDescription extends Component {
  render () {
    const {t, id, tabData} = this.props
    const {subtitle, image, imageClass = ''} = tabData[id] || {}
    const label = makeLabel(id, tabData)

    const sub = t.format(subtitle)
    let imageStyle
    if (image) {
      imageStyle = {
        backgroundImage: `url("${image}")`
      }
    }

    return <section className='description'>
      {image
        ? <div className={`description-image ${imageClass}`} style={imageStyle}></div>
        : ''
      }
      <div className='description-titles'>
        <h2>{t.format(label)}</h2>
        {sub && sub.length > 0
          ? <h3>{sub}</h3>
          : ''
        }
      </div>
    </section>
  }
}

HubBreadDescription.propTypes = {
  id: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  tabs: PropTypes.shape({
    constant: PropTypes.array,
    transient: PropTypes.array
  }),
  tabData: PropTypes.object.isRequired,

  t: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  id: (state) => state.session.navigation.id,
  tabData: (state) => state.session.navigation.tabData,
  market: (state) => state.market
})

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubBreadDescription)
