
import React from 'react'
import {PropTypes, Component} from 'react'
import {connect} from './connect'
import classNames from 'classnames'

const HALLOWEEN_WHITELIST = {
  windows8: true,
  tux: true,
  apple: true
}

/**
 * An icon from the icomoon font.
 * Peek in the static/fonts/icomoon/ folder to learn more.
 */
class Icon extends Component {
  render () {
    const {icon, classes, halloween} = this.props
    if (!icon) {
      return <span/>
    }

    let trueIcon = icon
    if (halloween && !HALLOWEEN_WHITELIST[icon]) {
      trueIcon = 'pumpkin'
    }

    const className = classNames(`icon icon-${trueIcon}`, classes)
    return <span className={className} data-tip={this.props['data-tip']}/>
  }
}

const mapStateToProps = (state) => ({
  halloween: state.status.bonuses.halloween
})

Icon.propTypes = {
  icon: PropTypes.string,
  classes: PropTypes.array,
  'data-tip': PropTypes.string
}

export default connect(mapStateToProps)(Icon)
