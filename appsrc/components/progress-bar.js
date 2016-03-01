
const r = require('r-dom')
const PropTypes = require('react').PropTypes
const ShallowComponent = require('./shallow-component')

/**
 * A single progress bar, with an outer and inner div. Style as you wish.
 */
class ProgressBar extends ShallowComponent {
  render () {
    let progress = this.props.progress
    if (!progress) return r.div()

    let style = {
      width: `${progress * 100}%`
    }

    return (
      r.div({className: 'progress_outer'}, [
        r.div({className: 'progress_inner', style})
      ])
    )
  }
}

ProgressBar.propTypes = {
  progress: PropTypes.number
}

module.exports = ProgressBar
