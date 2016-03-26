
import React, {Component, PropTypes} from 'react'
import {connect} from '../connect'
import classNames from 'classnames'
import {createSelector, createStructuredSelector} from 'reselect'
import {camelify} from '../../util/format'

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

const isPlatformCompatible = (game) => {
  const prop = camelify(`p_${os.itchPlatform()}`)
  return !!game[prop]
}

class MainAction extends Component {
  render () {
    const {t, platformCompatible, mayDownload, progress, task, action, animate} = this.props

    let child = ''

    if (task) {
      child = <span className='normal-state'>
        <TaskIcon task={task} animate={animate} action={action}/>
        {this.status()}
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
      'buy-now': (platformCompatible && !mayDownload),
      cancellable: /^download.*/.test(task),
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

    const button = <div className={classNames('main-action', classSet)} onClick={() => this.onClick()}>{child}</div>

    const tooltipOpts = this.tooltipOpts()
    return <span {...tooltipOpts}>
      {button}
    </span>
  }

  tooltipOpts () {
    const {t, task} = this.props

    if (task === 'error') {
      return {
        className: 'hint--bottom',
        'data-hint': t('grid.item.report_problem')
      }
    } else if (task === 'download') {
      return {
        className: 'hint--bottom',
        'data-hint': t('grid.item.cancel_download')
      }
    } else {
      return {}
    }
  }

  onClick () {
    let {task, cave, game, platformCompatible, mayDownload} = this.props

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

  status () {
    const {t, task, progress, action} = this.props

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
  // specified
  game: PropTypes.shape({
    id: PropTypes.any.isRequired
  }),

  // derived
  animate: PropTypes.bool,
  action: PropTypes.string,
  cave: PropTypes.any,
  mayDownload: PropTypes.bool,
  platformCompatible: PropTypes.bool,
  task: PropTypes.string,
  progress: PropTypes.number,

  t: PropTypes.func.isRequired,
  queueGame: PropTypes.func.isRequired,
  reportCave: PropTypes.func.isRequired,
  cancelCave: PropTypes.func.isRequired,
  initiatePurchase: PropTypes.func.isRequired,
  browseGame: PropTypes.func.isRequired
}

const makeMapStateToProps = () => {
  const selector = createSelector(
    createStructuredSelector({
      game: (state, props) => props.game,
      cave: (state, props) => state.globalMarket.cavesByGameId[props.game.id],
      task: (state, props) => state.tasks.tasksByGameId[props.game.id],
      download: (state, props) => state.tasks.downloadsByGameId[props.game.id]
    }),
    (happenings) => {
      const {game, task, download} = happenings
      const animate = false
      const action = ClassificationActions[game.classification] || 'launch'
      const platformCompatible = (action === 'open' ? true : isPlatformCompatible(game))

      return {
        animate,
        platformCompatible,
        action,
        task: (task ? task.name : (download ? 'download' : null)),
        progress: (task ? task.progress : (download ? download.progress : 0))
      }
    }
  )

  return selector
}

const mapDispatchToProps = (dispatch) => ({
  queueGame: (game) => dispatch(actions.queueGame({game})),
  reportCave: (caveId) => dispatch(actions.reportCave({caveId})),
  cancelCave: (caveId) => dispatch(actions.cancelCave({caveId})),
  initiatePurchase: (game) => dispatch(actions.initiatePurchase({game})),
  browseGame: (gameId, url) => dispatch(actions.initiatePurchase({gameId, url}))
})

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(MainAction)
