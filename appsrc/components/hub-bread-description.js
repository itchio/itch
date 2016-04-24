
import React, {Component, PropTypes} from 'react'
import {connect} from './connect'

class HubBreadDescription extends Component {
  render () {
    const {t, path, tabData} = this.props
    const {label = 'Loading...', subtitle, image, imageClass = ''} = tabData[path] || {}

    const sub = t.format(subtitle)
    let imageStyle
    if (image) {
      imageStyle = {
        backgroundImage: `url("${image}")`
      }
    }

    return <section className='description'>
      { image
        ? <div className={`description-image ${imageClass}`} style={imageStyle}></div>
        : '' }
      <div className='description-titles'>
        <h2>{t.format(label)}</h2>
        { sub && sub.length > 0
          ? <h3>{sub}</h3>
          : '' }
      </div>
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
