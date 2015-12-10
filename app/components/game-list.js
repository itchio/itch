'use nodent';'use strict'

let r = require('r-dom')
let React = require('react')
let mori = require('mori')
let PropTypes = require('react').PropTypes
let Component = require('./component')

let AppActions = require('../actions/app-actions')

let misc = require('./misc')
let TaskIcon = misc.TaskIcon
let Icon = misc.Icon

class GameCell extends Component {
  render () {
    let game = this.props.game
    let cave = this.props.cave
    let title = mori.get(game, 'title')
    let cover_url = mori.get(game, 'cover_url')
    let user = mori.get(game, 'user')
    let has_cover = !!cover_url

    let style = {
      backgroundImage: cover_url && `url('${cover_url}')`
    }

    let button_classes = 'game_launch button'
    if (cave) {
      button_classes += ` cave_${mori.get(cave, 'task')}`
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

    return (
      r.div({className: 'game_cell'}, [
        r.div({className: 'bordered'}, [
          r.div({
            style,
            classSet: {
              game_thumb: true,
              has_cover
            },
            onClick: () => {
              require('electron').remote.require('electron').shell.openExternal(mori.get(game, 'url'))
            }
          })
        ]),
        r.div({className: 'game_title'}, title),
        (user
        ? r.div({className: 'game_author'}, user.display_name)
        : ''),
        r.div({className: button_classes, style: button_style, onClick: () => AppActions.cave_queue(mori.get(game, 'id'))}, [
          cave
          ? r.span({}, [
            r(TaskIcon, {task: mori.get(cave, 'task')}),
            this.status(cave)
          ])
          : r.span({}, [
            r(Icon, {icon: 'install'}),
            ' Install'
          ])
        ])
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
    let games = this.props.games
    let caves = this.props.caves
    let index_by = (acc, k, v) => mori.assoc(acc, mori.get(v, 'game_id'), v)
    let caves_by_game_id = mori.reduceKV(index_by, mori.hashMap(), caves)

    return (
      r.div({className: 'game_list'}, mori.intoArray(mori.map(game => {
        let game_id = mori.get(game, 'id')
        let cave = mori.get(caves_by_game_id, game_id)
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
