
import React from 'react'
import {PropTypes, Component} from 'react'
import classNames from 'classnames'

/**
 * An icon from the icomoon font.
 * Peek in the static/fonts/icomoon/ folder to learn more.
 */
class Icon extends Component {
  render () {
    const {icon, classes} = this.props
    if (!icon) {
      return <span/>
    }

    const className = classNames(`icon icon-${icon}`, classes)
    return <span className={className} data-tip={this.props['data-tip']}/>
  }
}

Icon.propTypes = {
  icon: PropTypes.string,
  classes: PropTypes.array,
  'data-tip': PropTypes.string
}

export default Icon
