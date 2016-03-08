
import r from 'r-dom'
import {PropTypes, Component} from 'react'

/**
 * An icon from the icomoon font.
 * Peek in the static/fonts/icomoon/ folder to learn more.
 */
class Icon extends Component {
  render () {
    const {icon, spin = false, classSet} = this.props
    const data_tip = this.props['data-tip']

    if (!icon) {
      return r.span()
    }

    let opts = {
      className: `icon icon-${icon}`,
      classSet: Object.assign({spin}, classSet)
    }
    if (data_tip) {
      opts['data-tip'] = data_tip
    }

    return r.span(opts)
  }
}

Icon.propTypes = {
  icon: PropTypes.string
}

export default Icon
