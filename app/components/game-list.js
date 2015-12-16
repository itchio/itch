'use strict'

let r = require('r-dom')
let React = require('react')
let mori = require('mori')
let PropTypes = require('react').PropTypes
let Component = require('./component')

let AppActions = require('../actions/app-actions')
let os = require('../util/os')

let misc = require('./misc')
let TaskIcon = misc.TaskIcon
let Icon = misc.Icon

let platform_data = mori.toClj({
  p_android: {icon: 'android', platform: 'android'},
  p_windows: {icon: 'windows8', platform: 'windows'},
  p_linux: {icon: 'tux', platform: 'linux'},
  p_osx: {icon: 'apple', platform: 'osx'}
})

class GameCell extends Component {
  render () {
    let game = this.props.game
    let cave = this.props.cave
    let task = cave && mori.get(cave, 'task')
    let title = mori.get(game, 'title')
    let cover_url = mori.get(game, 'cover_url')
    let user = mori.get(game, 'user')
    let has_cover = !!cover_url

    let style = {
      backgroundImage: cover_url && `url('${cover_url}')`
    }

    let button_classes = 'game_launch button'
    if (cave) {
      button_classes += ` cave_${task}`
    } else {
      button_classes += ` uninstalled`
    }

    let button_style = {}
    if (cave && mori.get(cave, 'progress') > 0) {
      let percent = (mori.get(cave, 'progress') * 100).toFixed() + '%'
      let done_color = '#444'
      let undone_color = '#222'
      button_style.backgroundImage = `-webkit-linear-gradient(left, ${done_color}, ${done_color} ${percent}, ${undone_color} ${percent}, ${undone_color})`
    }

    let platform_list = mori.reduceKV((l, platform, data) => {
      if (mori.get(this.props.game, platform)) {
        let is_active = os.itch_platform() === mori.get(data, 'platform')
        let className = `icon icon-${mori.get(data, 'icon')}` + (is_active ? ' active' : '')
        l.push(r.span({ className }))
      }
      return l
    }, [], platform_data)

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
              let remote = require('electron').remote
              let shell = remote.require('electron').shell
              if (e.ctrlKey || e.shiftKey) {
                AppActions.cave_explore(mori.get(cave, '_id'))
              } else if (e.altKey) {
                AppActions.cave_probe(mori.get(cave, '_id'))
              } else {
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
            if (cave && task === 'error') {
              AppActions.cave_probe(mori.get(cave, '_id'))
            } else {
              AppActions.cave_queue(mori.get(game, 'id'))
            }
          }
        }, [
          cave
          ? r.span({}, [
            r(TaskIcon, {task}),
            this.status(cave)
          ])
          : r.span({}, [
            r(Icon, {icon: 'install'}),
            ' Install'
          ])
        ]),
        ((cave && ['idle', 'error'].indexOf(task) !== -1)
        ? r.div({className: 'cave_actions'}, [
          r.span({
            className: 'game_explore',
            onClick: () => AppActions.cave_explore(mori.get(cave, '_id'))
          }, [
            r(Icon, {icon: 'folder-open'})
          ]),
          r.span({
            className: 'game_uninstall',
            onClick: () => {
              if (task === 'error' || window.confirm(`Are you sure you want to uninstall ${title}?`)) {
                AppActions.cave_queue_uninstall(mori.get(cave, '_id'))
              }
            }
          }, [
            r(Icon, {icon: 'delete'})
          ])
        ])
        : '')
      ])
    )
  }

  status (cave) {
    let task = mori.get(cave, 'task')
    let progress = mori.get(cave, 'progress')

    if (task === 'idle') {
      return 'Launch'
    }
    if (task === 'error') {
      return 'Broken'
    }
    if (task === 'launch') {
      return 'Running...'
    }

    let res = 'Installing...'
    if (task === 'download') {
      res = 'Downloading...'
    }
    if (task === 'download-queued') {
      res = 'Download queued'
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

class GameList extends React.Component {
  render () {
    let pred = this.props.pred || (() => true)
    let games = this.props.games
    let caves = this.props.caves
    let index_by = (acc, k, v) => mori.assoc(acc, mori.get(v, 'game_id'), v)
    let caves_by_game_id = mori.reduceKV(index_by, mori.hashMap(), caves)

    return (
      r.div({className: 'game_list'}, mori.intoArray(mori.map(game => {
        let game_id = mori.get(game, 'id')
        let cave = mori.get(caves_by_game_id, game_id)
        if (!pred(cave)) return ''
        return r(GameCell, {key: game_id, game, cave})
      }, games)))
    )
  }
}

GameList.propTypes = {
  games: PropTypes.any,
  caves: PropTypes.any
}

module.exports = {GameCell, GameList}
