
let r = require('r-dom')
let PropTypes = require('react').PropTypes
let ShallowComponent = require('../shallow-component')

let Tooltip = require('rc-tooltip')
let Icon = require('../icon')
let TaskIcon = require('../task-icon')

let AppActions = require('../../actions/app-actions')
let classification_actions = require('../../constants/classification-actions')

let platform = require('../../util/os').itch_platform()

let linear_gradient = (progress) => {
  let percent = (progress * 100).toFixed() + '%'
  let done_color = '#444'
  let undone_color = '#222'
  return `-webkit-linear-gradient(left, ${done_color}, ${done_color} ${percent}, ${undone_color} ${percent}, ${undone_color})`
}

let icon_info = (cave) => {
  let progress = cave ? cave.progress : 0
  let task = cave ? cave.task : null
  let spin = false

  if (progress < 0) {
    spin = true
  } else if (cave && cave.reporting) {
    task = 'report'
    spin = true
  } else if (cave && cave.need_blessing) {
    task = 'ask-before-install'
    spin = true
  }

  if (task === 'check-for-update') {
    task = 'idle'
  }

  return { task, spin }
}

class MainAction extends ShallowComponent {
  render () {
    let t = this.t

    let cave = this.props.cave
    let game = this.props.game
    let platform_compatible = this.props.platform_compatible
    let may_download = this.props.may_download

    let classification = game.classification
    let action = classification_actions[classification]
    if (action === 'open') {
      platform_compatible = true
    }

    let progress = cave ? cave.progress : 0
    let info = icon_info(cave)
    let task = info.task
    let spin = info.spin

    let onClick = () => this.on_click(task, may_download, platform_compatible)

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
      if (platform_compatible) {
        if (may_download) {
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
      incompatible: !platform_compatible,
      buy_now: (platform_compatible && !may_download),
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
      style.backgroundImage = linear_gradient(progress)
    }

    let button = r.div({ classSet, style, onClick }, child)

    let tooltip_opts = this.tooltip_opts(task)
    return r(Tooltip, tooltip_opts, button)
  }

  tooltip_opts (task) {
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
      return { visible: false, overlay: '' }
    }
  }

  on_click (task, may_download, platform_compatible) {
    let {cave, game} = this.props

    if (task === 'error') {
      AppActions.report_cave(cave.id)
    } else if (/^download.*$/.test(task)) {
      AppActions.cancel_cave(cave.id)
    } else {
      if (platform_compatible) {
        if (may_download) {
          AppActions.queue_game(game)
        } else {
          AppActions.initiate_purchase(game.id)
        }
      } else {
        AppActions.browse_game(game.id)
      }
    }
  }

  status (cave, task, action) {
    let t = this.t
    let progress = cave ? cave.progress : 0

    if (task === 'idle' || task === 'awaken' || task === 'check-for-update') {
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

module.exports = MainAction
