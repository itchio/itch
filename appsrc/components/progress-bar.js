
import r from 'r-dom'
import {PropTypes} from 'react'
import ShallowComponent from './shallow-component'

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

export default ProgressBar
