
let r = require('r-dom')
let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let Icon = require('./icon')

// TODO: move to `constants/`
let task_to_icon = {
  'error': 'heart-broken',
  'find-upload': 'stopwatch',
  'download': 'download',
  'download-queued': 'hand-paper-o',
  'install': 'file-zip',
  'configure': 'cog',
  'launch': 'fire',
  'idle': 'checkmark'
}

/**
 * An icon that represents the state of a given task
 */
class TaskIcon extends ShallowComponent {
  render () {
    let task = this.props.task || ''
    let spin = !!this.props.spin
    let icon = task_to_icon[task] || ''

    if (spin) {
      // TODO: fix me, that's ugly
      icon = 'upload-to-cloud'
    }

    return r(Icon, {icon, spin})
  }
}

TaskIcon.propTypes = {
  task: PropTypes.string
}

module.exports = TaskIcon
