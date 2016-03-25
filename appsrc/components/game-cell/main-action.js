
import React, {Component, PropTypes} from 'react'
import {connect} from '../connect'
import classNames from 'classnames'

import Icon from '../icon'
import TaskIcon from '../task-icon'

import * as actions from '../../actions'

import ClassificationActions from '../../constants/classification-actions'

import os from '../../util/os'
const platform = os.itchPlatform()

const linearGradient = (progress) => {
  let percent = (progress * 100).toFixed() + '%'
  let doneColor = '#444'
  let undoneColor = '#222'
  return `-webkit-linear-gradient(left, ${doneColor}, ${doneColor} ${percent}, ${undoneColor} ${percent}, ${undoneColor})`
}

class MainAction extends Component {
  render () {
    const {t, cave, game, mayDownload, tasksByGameId} = this.props
    const {classification} = game
    const action = ClassificationActions[classification]

    let {platformCompatible} = this.props
    if (action === 'open') {
      platformCompatible = true
    }

    const taskObject = tasksByGameId[game.id]
    const progress = taskObject ? taskObject.progress : 0
    const task = taskObject ? taskObject.name : null
    const spin = false

    const onClick = () => this.onClick(task, mayDownload, platformCompatible)

    let child = ''

    if (taskObject) {
      child = <span className='normal-state'>
        <TaskIcon task={task} spin={spin} action={action}/>
        {this.status(cave, task, action)}
        <span className='cancel-cross'>
          <Icon icon='cross'/>
        </span>
      </span>
    } else {
      if (platformCompatible) {
        if (mayDownload) {
          child = <span>
            <Icon icon='install'/>
            {t('grid.item.install')}
          </span>
        } else {
          child = <span>
            <Icon icon='cart'/>
            {t('grid.item.buy_now')}
          </span>
        }
      } else {
        child = <span>
          {t('grid.item.not_platform_compatible', {platform})}
        </span>
      }
    }

    let classSet = {
      incompatible: !platformCompatible,
      buy_now: (platformCompatible && !mayDownload),
      cancellable: /^download.*/.test(task),
      main_action: true,
      button: true
    }

    if (task) {
      classSet[`task-${task}`] = true
    } else {
      classSet.uninstalled = true
    }

    classSet[`action-${action}`] = true

    let style = {}
    if (progress > 0) {
      style.backgroundImage = linearGradient(progress)
    }

    const button = <div className={classNames(classSet)} onClick={onClick}>{child}</div>
    let tooltipOpts = this.tooltipOpts(task)

    return <span {...tooltipOpts}>
      {button}
    </span>
  }

  iconInfo (cave) {
    const {tasksByGameId} = this.props
    let taskObject = tasksByGameId[cave]

    let task = taskObject && taskObject.name
    let {progress = 0} = taskObject

    let spin = false
    if (progress < 0) {
      spin = true
    } else if (cave && cave.reporting) {
      task = 'report'
      spin = true
    } else if (cave && cave.needBlessing) {
      task = 'ask-before-install'
      spin = true
    }

    return {task, spin}
  }

  tooltipOpts (task) {
    let t = this.t

    if (task === 'error') {
      return {
        className: 'hint--bottom',
        'data-hint': t('grid.item.report_problem')
      }
    } else if (/^download.*$/.test(task)) {
      return {
        className: 'hint--bottom',
        'data-hint': t('grid.item.cancel_download')
      }
    } else {
      return {}
    }
  }

  onClick (task, mayDownload, platformCompatible) {
    let {cave, game} = this.props

    if (task === 'error') {
      this.props.reportCave(cave.id)
    } else if (/^download.*$/.test(task)) {
      this.props.cancelCave(cave.id)
    } else {
      if (platformCompatible) {
        if (mayDownload) {
          this.props.queueGame(game)
        } else {
          this.props.initiatePurchase(game)
        }
      } else {
        this.props.browseGame(game.id, game.url)
      }
    }
  }

  status (taskObject, action) {
    const {t} = this.props
    const task = taskObject ? taskObject.name : null
    const progress = taskObject ? taskObject.progress : 0

    if (task === 'idle' || task === 'awaken') {
      switch (action) {
        case 'open':
          return t('grid.item.open')
        case 'launch':
        default:
          return t('grid.item.launch')
      }
    }

    if (task === 'error' || task === 'reporting') {
      return ''
    }

    if (task === 'launch') {
      return t('grid.item.running')
    }

    let res = t('grid.item.installing')
    if (task === 'uninstall') {
      res = t('grid.item.uninstalling')
    }
    if (task === 'download' || task === 'find-upload') {
      res = t('grid.item.downloading')
    }
    if (task === 'ask-before-install') {
      res = t('grid.item.finalize_installation')
    }
    if (task === 'download-queued') {
      res = t('grid.item.queued')
    }

    if (progress > 0) {
      let progressText = `(${(progress * 100).toFixed()}%)`
      return <span>
        {res}
        <span className='progress-text'>{progressText}</span>
      </span>
    } else {
      return res
    }
  }
}

MainAction.propTypes = {
  mayDownload: PropTypes.bool,
  platformCompatible: PropTypes.bool,
  // FIXME: any is bad, specify what we use
  cave: PropTypes.any,
  game: PropTypes.any,

  tasksByGameId: PropTypes.any,

  t: PropTypes.func.isRequired,
  queueGame: PropTypes.func.isRequired,
  reportCave: PropTypes.func.isRequired,
  cancelCave: PropTypes.func.isRequired,
  initiatePurchase: PropTypes.func.isRequired,
  browseGame: PropTypes.func.isRequired
}

const mapStateToProps = (state) => ({
  tasksByGameId: state.tasks.tasksByGameId
})

const mapDispatchToProps = (dispatch) => ({
  queueGame: (game) => dispatch(actions.queueGame({game})),
  reportCave: (caveId) => dispatch(actions.reportCave({caveId})),
  cancelCave: (caveId) => dispatch(actions.cancelCave({caveId})),
  initiatePurchase: (game) => dispatch(actions.initiatePurchase({game})),
  browseGame: (gameId, url) => dispatch(actions.initiatePurchase({gameId, url}))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MainAction)
