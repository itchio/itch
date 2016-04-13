
import React, {Component, PropTypes} from 'react'
import {connect} from '../connect'
import classNames from 'classnames'

import Icon from '../icon'
import TaskIcon from '../task-icon'

const linearGradient = (progress) => {
  let percent = (progress * 100).toFixed() + '%'
  let doneColor = '#414141'
  let undoneColor = '#2B2B2B'
  return `-webkit-linear-gradient(left, ${doneColor}, ${doneColor} ${percent}, ${undoneColor} ${percent}, ${undoneColor})`
}

class MainAction extends Component {
  render () {
    const {t, cancellable, platform, platformCompatible, mayDownload, progress, task, action, animate} = this.props

    let child = ''

    if (task) {
      child = <span className='normal-state'>
        <TaskIcon task={task} animate={animate} action={action}/>
        {this.status()}
        { cancellable
        ? <span className='cancel-cross'>
          <Icon icon='cross'/>
        </span>
        : '' }
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
        return <span className='not-platform-compatible'>
          {t('grid.item.not_platform_compatible', {platform})}
        </span>
      }
    }

    let style = {}
    if (progress > 0) {
      style.backgroundImage = linearGradient(progress)
    }

    const hint = this.hint()

    const buttonClasses = classNames('main-action', {
      'buy-now': (platformCompatible && !mayDownload),
      'hint--top': hint
    })
    const button = <div style={style} className={buttonClasses} onClick={() => this.onClick()} data-hint={hint}>
      {child}
    </div>

    return button
  }

  hint () {
    const {t, task} = this.props

    if (task === 'error') {
      return t('grid.item.report_problem')
    } else if (task === 'download') {
      return t('grid.item.cancel_download')
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
        if (mayDownload || cave) {
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

    return res
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
  platform: PropTypes.string,
  platformCompatible: PropTypes.bool,
  task: PropTypes.string,
  progress: PropTypes.number,
  cancellable: PropTypes.bool,

  t: PropTypes.func.isRequired,
  queueGame: PropTypes.func.isRequired,
  reportCave: PropTypes.func.isRequired,
  cancelCave: PropTypes.func.isRequired,
  initiatePurchase: PropTypes.func.isRequired,
  browseGame: PropTypes.func.isRequired
}

export default connect()(MainAction)
