
let r = require('r-dom')
let mori = require('mori')
let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let Icon = require('./icon')
let TaskIcon = require('./task-icon')
let Tooltip = require('rc-tooltip')

let os = require('../util/os')
let AppActions = require('../actions/app-actions')

// TODO: move somewhere into `./constants/`
let platform_data = mori.toClj({
  p_android: {icon: 'android', platform: 'android'},
  p_windows: {icon: 'windows8', platform: 'windows'},
  p_linux: {icon: 'tux', platform: 'linux'},
  p_osx: {icon: 'apple', platform: 'osx'}
})

/**
 * TODO: This component does waaaaay too much. Split it!
 */
class GameCell extends ShallowComponent {
  render () {
    let t = this.t
    let game = this.props.game
    let owned = this.props.owned
    let cave = this.props.cave
    let task = mori.get(cave, 'task')
    let progress = mori.get(cave, 'progress')
    let title = mori.get(game, 'title')
    let cover_url = mori.get(game, 'cover_url')
    let user = mori.get(game, 'user')
    let has_cover = !!cover_url

    let style = {}

    if (has_cover) {
      style.backgroundImage = `url('${cover_url}')`
    }

    let icon_spin = false
    if (mori.get(cave, 'reporting')) {
      task = 'report'
      icon_spin = true
    }

    if (mori.get(cave, 'need_blessing')) {
      task = 'ask-before-install'
      icon_spin = true
    }

    // TODO: use classSet
    let button_classes = 'game_launch button'
    if (cave) {
      button_classes += ` cave_${task}`
    } else {
      button_classes += ` uninstalled`
    }
    if (has_cover) {
      button_classes += ` has_cover`
    }
    let cancellable = /^download.*/.test(task)
    if (cancellable) {
      button_classes += ` cancellable`
    }

    let button_style = {}
    if (progress > 0) {
      let percent = (progress * 100).toFixed() + '%'
      let done_color = '#444'
      let undone_color = '#222'
      button_style.backgroundImage = `-webkit-linear-gradient(left, ${done_color}, ${done_color} ${percent}, ${undone_color} ${percent}, ${undone_color})`
    }
    if (progress < 0) {
      icon_spin = true
    }

    let platform_compatible = false

    /* before you think you can download all itch.io games:
       there's obviously server-side checking.
       you'll get neat error logs for free though! */
    let may_download = process.env.TRUST_ME_IM_AN_ENGINEER ||
      owned ||
      (mori.get(game, 'min_price') === 0)

    let platform_list = mori.reduceKV((l, platform, data) => {
      if (mori.get(this.props.game, platform)) {
        let is_active = os.itch_platform() === mori.get(data, 'platform')
        if (is_active) {
          platform_compatible = true
        }
        let className = `icon icon-${mori.get(data, 'icon')}` + (is_active ? ' active' : '')
        l.push(r.span({ className }))
      }
      return l
    }, [], platform_data)

    if (platform_compatible && !may_download) {
      button_classes += ` buy_now`
    }

    if (!platform_compatible) {
      button_classes += ` incompatible`
    }

    return (
      r.div({className: 'game_cell'}, [
        r.div({className: 'bordered'}, [
          r.div({
            style,
            classSet: {
              game_thumb: true,
              has_cover
            },
            onClick: (e) => {
              if (e.ctrlKey || e.shiftKey) {
                AppActions.cave_explore(mori.get(cave, '_id'))
              } else if (e.altKey) {
                AppActions.cave_probe(mori.get(cave, '_id'))
              } else {
                let remote = require('electron').remote
                let shell = remote.require('electron').shell
                shell.openExternal(mori.get(game, 'url'))
              }
            }
          }),
          (platform_list.length
          ? r.div({className: 'platforms'}, platform_list)
          : '')
        ]),
        r.div({className: 'game_title'}, title),
        (user
        ? r.div({className: 'game_author'}, user.display_name)
        : ''),
        r(Tooltip, (function () {
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
        })(), r.div({
          className: button_classes, style: button_style,
          onClick: () => {
            if (task === 'error') {
              AppActions.cave_report(mori.get(cave, '_id'))
            } else if (/^download.*$/.test(task)) {
              AppActions.cave_implode(mori.get(cave, '_id'))
            } else {
              if (platform_compatible) {
                if (may_download) {
                  AppActions.cave_queue(mori.get(game, 'id'))
                } else {
                  AppActions.game_purchase(mori.get(game, 'id'))
                }
              } else {
                AppActions.game_browse(mori.get(game, 'id'))
              }
            }
          }
        }, [
          cave
          ? [
            r.span({className: 'normal_state'}, [
              r(TaskIcon, {task, spin: icon_spin}),
              this.status(cave, task),
              r.span({className: 'cancel_cross'}, [
                r(Icon, {icon: 'cross'})
              ])
            ])
          ]
          : (
            platform_compatible
            ? (
              may_download
              ? r.span({}, [
                r(Icon, {icon: 'install'}),
                ' ' + t('grid.item.install')
              ])
              : r.span({}, [
                r(Icon, {icon: 'cart'}),
                ' ' + t('grid.item.buy_now')
              ])
            )
            : r.span({}, [
              t('grid.item.not_platform_compatible', {platform: os.itch_platform()})
            ])
          )
        ])),

        ((cave && ['idle', 'error'].indexOf(task) !== -1)
        ? r.div({classSet: {cave_actions: true, error: (task === 'error')}}, (
          (task === 'error')
          ? [
            this.tooltip('grid.item.retry', r.span({
              className: 'game_retry',
              onClick: () => AppActions.cave_queue(mori.get(game, 'id'))
            }, [
              r(Icon, {icon: 'refresh'})
            ])),

            this.tooltip('grid.item.probe', r.span({
              className: 'game_probe',
              onClick: () => AppActions.cave_probe(mori.get(cave, '_id'))
            }, [
              r(Icon, {icon: 'bug'})
            ]))

          ]
          : []
        ).concat(
          (task === 'error')
          ? []
          : [
            this.tooltip('grid.item.purchase_or_donate', r.span({
              className: 'game_purchase',
              onClick: () => AppActions.game_purchase(mori.get(game, 'id'))
            }, [
              r(Icon, {icon: 'cart'})
            ])),

            this.tooltip(this.browse_i18n_key(), r.span({
              className: 'game_explore',
              onClick: () => AppActions.cave_explore(mori.get(cave, '_id'))
            }, [
              r(Icon, {icon: 'folder-open'})
            ]))
          ]).concat([
            this.tooltip('grid.item.uninstall', r.span({
              className: 'game_uninstall',
              onClick: () => AppActions.cave_request_uninstall(mori.get(cave, '_id'))
            }, [
              r(Icon, {icon: 'delete'})
            ]))
          ]))
          : '')
      ])
    )
  }

  status (cave, task) {
    let t = this.t
    let progress = mori.get(cave, 'progress')

    if (task === 'idle' || task === 'awaken') {
      return t('grid.item.launch')
    }
    if (task === 'error') {
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
      return r.span({}, [
        res,
        r.span({className: 'progress_text'}, ` (${(progress * 100).toFixed()}%)`)
      ])
    } else {
      return res
    }
  }

  tooltip (key, component) {
    let t = this.t

    return r(Tooltip, {
      mouseEnterDelay: 0.5,
      placement: 'top',
      overlay: r.span({}, t(key))
    }, component)
  }

  browse_i18n_key () {
    let fallback = 'grid.item.open_in_file_explorer'
    switch (os.platform()) {
      case 'darwin': return ['grid.item.open_in_file_explorer_osx', fallback]
      case 'linux': return ['grid.item.open_in_file_explorer_linux', fallback]
      default: return fallback
    }
  }
}

GameCell.propTypes = {
  game: PropTypes.object,
  cave: PropTypes.object
}

module.exports = GameCell
