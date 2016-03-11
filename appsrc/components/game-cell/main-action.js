
import r from 'r-dom'
import {PropTypes} from 'react'
import ShallowComponent from '../shallow-component'

import Tooltip from 'rc-tooltip'
import Icon from '../icon'
import TaskIcon from '../task-icon'

import AppActions from '../../actions/app-actions'
import ClassificationActions from '../../constants/classification-actions'

import os from '../../util/os'
const platform = os.itchPlatform()

let linearGradient = (progress) => {
  let percent = (progress * 100).toFixed() + '%'
  let doneColor = '#444'
  let undoneColor = '#222'
  return `-webkit-linear-gradient(left, ${doneColor}, ${doneColor} ${percent}, ${undoneColor} ${percent}, ${undoneColor})`
}

let iconInfo = (cave) => {
  let progress = cave ? cave.progress : 0
  let task = cave ? cave.task : null
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

class MainAction extends ShallowComponent {
  render () {
    let t = this.t

    let cave = this.props.cave
    let game = this.props.game
    let platformCompatible = this.props.platformCompatible
    let mayDownload = this.props.mayDownload

    let classification = game.classification
    let action = ClassificationActions[classification]
    if (action === 'open') {
      platformCompatible = true
    }

    let progress = cave ? cave.progress : 0
    let info = iconInfo(cave)
    let task = info.task
    let spin = info.spin

    let onClick = () => this.onClick(task, mayDownload, platformCompatible)

    let child = ''

    if (cave) {
      child = r.span({className: 'normal_state'}, [
        r(TaskIcon, {task, spin, action}),
        this.status(cave, task, action),
        r.span({className: 'cancel_cross'}, [
          r(Icon, {icon: 'cross'})
        ])
      ])
    } else {
      if (platformCompatible) {
        if (mayDownload) {
          child = r.span({}, [
            r(Icon, {icon: 'install'}),
            ' ' + t('grid.item.install')
          ])
        } else {
          child = r.span({}, [
            r(Icon, {icon: 'cart'}),
            ' ' + t('grid.item.buy_now')
          ])
        }
      } else {
        child = r.span({}, [
          t('grid.item.not_platform_compatible', {platform})
        ])
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
      classSet[`task_${task}`] = true
    } else {
      classSet.uninstalled = true
    }

    classSet[`action_${action}`] = true

    let style = {}
    if (progress > 0) {
      style.backgroundImage = linearGradient(progress)
    }

    let button = r.div({classSet, style, onClick}, child)

    let tooltipOpts = this.tooltipOpts(task)
    return r(Tooltip, tooltipOpts, button)
  }

  tooltipOpts (task) {
    let t = this.t

    if (task === 'error') {
      return {
        placement: 'bottom',
        mouseEnterDelay: 0.4,
        overlay: r.span({}, t('grid.item.report_problem'))
      }
    } else if (/^download.*$/.test(task)) {
      return {
        placement: 'bottom',
        mouseEnterDelay: 0.4,
        overlay: r.span({}, t('grid.item.cancel_download'))
      }
    } else {
      return {visible: false, overlay: ''}
    }
  }

  onClick (task, mayDownload, platformCompatible) {
    let {cave, game} = this.props

    if (task === 'error') {
      AppActions.report_cave(cave.id)
    } else if (/^download.*$/.test(task)) {
      AppActions.cancel_cave(cave.id)
    } else {
      if (platformCompatible) {
        if (mayDownload) {
          AppActions.queue_game(game)
        } else {
          AppActions.initiate_purchase(game)
        }
      } else {
        AppActions.browse_game(game.id, game.url)
      }
    }
  }

  status (cave, task, action) {
    let t = this.t
    let progress = cave ? cave.progress : 0

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
      let progress_text = `(${(progress * 100).toFixed()}%)`
      return r.span({}, [
        res,
        r.span({className: 'progress_text'}, ' ' + progress_text)
      ])
    } else {
      return res
    }
  }
}

MainAction.propTypes = {
  may_download: PropTypes.bool,
  platform_comaptible: PropTypes.bool,
  cave: PropTypes.any,
  game: PropTypes.any
}

export default MainAction
