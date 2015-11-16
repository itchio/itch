
import React from 'react'
import {PropTypes} from 'react'
import Component from './component'

/**
 * An icon from the icomoon font.
 * Peek in the static/fonts/icomoon/ folder to learn more.
 */
class Icon extends Component {
  render () {
    let {icon} = this.props

    if (icon) {
      return <span className={`icon icon-${icon}`}/>
    } else {
      return <span/>
    }
  }
}

Icon.propTypes = {
  icon: PropTypes.string
}

let task_to_icon = {
  'error': 'neutral',
  'find-upload': 'stopwatch',
  'download': 'download',
  'install': 'file-zip',
  'configure': 'settings',
  'launch': 'gamepad',
  'idle': 'checkmark'
}

/**
 * An icon that represents the state of a given task
 */
class TaskIcon extends Component {
  render () {
    let {task = ''} = this.props
    let icon = task_to_icon[task] || ''
    return <Icon {...{icon}}/>
  }
}

TaskIcon.propTypes = {
  task: PropTypes.string
}

/**
 * A single progress bar, with an outer and inner div. Style as you wish.
 */
class ProgressBar extends Component {
  render () {
    let {progress} = this.props
    if (!progress) return <div/>

    let style = {
      width: `${progress * 100}%`
    }

    return <div className='progress_outer'>
      <div className='progress_inner' style={style}/>
    </div>
  }
}

ProgressBar.propTypes = {
  progress: PropTypes.number
}

/**
 * A bunch of errors displayed in a list
 */
class ErrorList extends React.Component {
  render () {
    let error = this.props.errors

    if (!error) {
      return <div/>
    }

    let errors = {error}

    if (!Array.isArray(errors)) {
      errors = [error]
    }

    return <ul className='form_errors'>
      {errors.map((error, key) => {
        return <li key={key}>{error}</li>
      })}
    </ul>
  }
}

ErrorList.propTypes = {
  errors: PropTypes.oneOfType([PropTypes.array, PropTypes.string])
}

export default {Icon, TaskIcon, ProgressBar, ErrorList}
