
let r = require('r-dom')
let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

/**
 * An icon from the icomoon font.
 * Peek in the static/fonts/icomoon/ folder to learn more.
 */
class Icon extends ShallowComponent {
  render () {
    let icon = this.props.icon
    let spin = !!this.props.spin
    let data_tip = this.props['data-tip']

    if (icon) {
      let opts = {
        className: `icon icon-${icon}`,
        classSet: {spin}
      }
      if (data_tip) {
        opts['data-tip'] = data_tip
      }

      return r.span(opts)
    } else {
      return r.span()
    }
  }
}

Icon.propTypes = {
  icon: PropTypes.string
}

module.exports = Icon
