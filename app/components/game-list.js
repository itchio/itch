'use nodent';'use strict'

let React = require('react')
let mori = require('mori')
let PropTypes = require('react').PropTypes
let Component = require('./component')
let classNames = require('classnames')

let AppActions = require('../actions/app-actions')

let TaskIcon = require('./misc').TaskIcon

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

    return <div className='game_cell'>
      <div className='bordered'>
        <div className={classNames('game_thumb', {has_cover})} onClick={() => require('remote').require('shell').openExternal(mori.get(game, 'url'))} style={style}/>
      </div>
      <div className='game_title'>{title}</div>
      {user
      ? <div className='game_author'>{user.display_name}</div>
      : ''}
      <div className={button_classes} style={button_style} onClick={() => AppActions.cave_queue(mori.get(game, 'id'))}>
        {cave
        ? (
          <span>
            <TaskIcon task={mori.get(cave, 'task')}/> {this.status(cave)}
          </span>
        )
        : <span><span className='icon icon-install'/> Install</span>
        }
      </div>
    </div>
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

    return <div className='game_list'>
      {mori.intoArray(mori.map(game => {
        let game_id = mori.get(game, 'id')
        let cave = mori.get(caves_by_game_id, game_id)
        return <GameCell key={game_id} game={game} cave={cave}/>
      }, games))}
    </div>
  }
}

GameList.propTypes = {
  games: PropTypes.any,
  caves: PropTypes.any
}

module.exports = {GameCell, GameList}
