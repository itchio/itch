
let r = require('r-dom')
let mori = require('mori')
let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let Icon = require('./icon')
let TaskIcon = require('./task-icon')

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
    let task = cave && mori.get(cave, 'task')
    let title = mori.get(game, 'title')
    let cover_url = mori.get(game, 'cover_url')
    let user = mori.get(game, 'user')
    let has_cover = !!cover_url

    let style = {}

    if (has_cover) {
      style.backgroundImage = `url('${cover_url}')`
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
    if (cave && mori.get(cave, 'progress') > 0) {
      let percent = (mori.get(cave, 'progress') * 100).toFixed() + '%'
      let done_color = '#444'
      let undone_color = '#222'
      button_style.backgroundImage = `-webkit-linear-gradient(left, ${done_color}, ${done_color} ${percent}, ${undone_color} ${percent}, ${undone_color})`
    }

    let platform_compatible = false

    /* before you think you can download all itch.io games:
       there's obviously server-side checking.
       you'll get neat error logs for free though! */
    let may_download = process.env.TRUST_ME_IM_AN_ENGINEER || owned || (mori.get(game, 'min_price') === 0)

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
        r.div({
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
              r(TaskIcon, {task, spin: mori.get(cave, 'reporting')}),
              this.status(cave),
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
        ]),
        ((cave && ['idle', 'error'].indexOf(task) !== -1)
        ? r.div({classSet: {cave_actions: true, error: (task === 'error')}}, (
          (task === 'error')
          ? [
            r.span({
              className: 'game_retry',
              onClick: () => AppActions.cave_queue(mori.get(game, 'id'))
            }, [
              r(Icon, {icon: 'refresh'})
            ]),
            r.span({
              className: 'game_probe',
              onClick: () => AppActions.cave_probe(mori.get(cave, '_id'))
            }, [
              r(Icon, {icon: 'bug'})
            ])
          ]
          : []
        ).concat(
          (task === 'error')
          ? []
          : [
            r.span({
              className: 'game_purchase',
              onClick: () => AppActions.game_purchase(mori.get(game, 'id'))
            }, [
              r(Icon, {icon: owned ? 'heart-filled' : 'cart'})
            ]),
            r.span({
              className: 'game_explore',
              onClick: () => AppActions.cave_explore(mori.get(cave, '_id'))
            }, [
              r(Icon, {icon: 'folder-open'})
            ])
          ]).concat([
            r.span({
              className: 'game_uninstall',
              onClick: () => {
                let msg = t('prompt.confirm_uninstall', {title})
                if (task === 'error' || window.confirm(msg)) {
                  AppActions.cave_queue_uninstall(mori.get(cave, '_id'))
                }
              }
            }, [
              r(Icon, {icon: 'delete'})
            ])
          ]))
          : '')
      ])
    )
  }

  status (cave) {
    let t = this.t
    let task = mori.get(cave, 'task')
    let progress = mori.get(cave, 'progress')

    if (task === 'idle') {
      return t('grid.item.launch')
    }
    if (task === 'error') {
      return ''
    }
    if (task === 'launch') {
      return t('grid.item.running')
    }

    let res = t('grid.item.installing')
    if (task === 'download') {
      res = t('grid.item.downloading')
    }
    if (task === 'download-queued') {
      res = t('grid.item.queued')
    }

    if (progress > 0) {
      res += ` (${(progress * 100).toFixed()}%)`
    }
    return res
  }
}

GameCell.propTypes = {
  game: PropTypes.object,
  cave: PropTypes.object
}

module.exports = GameCell
