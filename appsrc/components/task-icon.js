
const r = require('r-dom')
const PropTypes = require('react').PropTypes
const ShallowComponent = require('./shallow-component')

const Icon = require('./icon')

// TODO: move to `constants/`
let task_to_icon = {
  'report': 'upload-to-cloud',
  'error': 'heart-broken',
  'find-upload': 'stopwatch',
  'download': 'download',
  'download-queued': 'hand-paper-o',
  'install': 'file-zip',
  'uninstall': 'delete',
  'ask-before-install': 'install',
  'configure': 'cog',
  'awaken': 'stopwatch',
  'launch': 'fire',
  'check-for-update': 'stopwatch',
  'idle': 'checkmark'
}

/**
 * An icon that represents the state of a given task
 */
class TaskIcon extends ShallowComponent {
  render () {
    let task = this.props.task || ''
    let action = this.props.action || 'launch'
    let spin = !!this.props.spin
    let icon = task_to_icon[task] || ''

    if (task === 'idle') {
      if (action === 'open') {
        icon = 'folder-open'
      } else {
        icon = 'rocket'
      }
    }

    return r(Icon, {icon, spin})
  }
}

TaskIcon.propTypes = {
  task: PropTypes.string
}

module.exports = TaskIcon
