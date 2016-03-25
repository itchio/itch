
import React, {Component, PropTypes} from 'react'

import Icon from './icon'

import taskToIcon from '../constants/icon-for-tasks'

/**
 * An icon that represents the state of a given task
 */
class TaskIcon extends Component {
  render () {
    const {task = '', action = 'launch', spin = false} = this.props

    let icon = taskToIcon[task] || ''
    if (task === 'idle') {
      if (action === 'open') {
        icon = 'folder-open'
      } else {
        icon = 'rocket'
      }
    }

    return <Icon icon={icon} spin={spin}/>
  }
}

TaskIcon.propTypes = {
  task: PropTypes.string,
  action: PropTypes.string,
  spin: PropTypes.any
}

export default TaskIcon
