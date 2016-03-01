
const r = require('r-dom')
const PropTypes = require('react').PropTypes
const ShallowComponent = require('./shallow-component')

/**
 * An icon from the icomoon font.
 * Peek in the static/fonts/icomoon/ folder to learn more.
 */
class Icon extends ShallowComponent {
  render () {
    let icon = this.props.icon
    let spin = !!this.props.spin
    let data_tip = this.props['data-tip']
    let additional_class_set = this.props.classSet

    if (icon) {
      let opts = {
        className: `icon icon-${icon}`,
        classSet: Object.assign({spin}, additional_class_set)
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
