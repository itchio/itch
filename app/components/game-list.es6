
import React from 'react'
import mori from 'mori'
import {PropTypes, Component} from 'react'
import classNames from 'classnames'

import AppActions from '../actions/app-actions'

import {TaskIcon} from './misc'

class GameCell extends Component {
  render () {
    let {game, install} = this.props
    let title = mori.get(game, 'title')
    let cover_url = mori.get(game, 'cover_url')
    let user = mori.get(game, 'user')
    let has_cover = !!cover_url

    let style = {
      backgroundImage: cover_url && `url('${cover_url}')`
    }

    let button_classes = 'game_launch button'
    if (install) {
      button_classes += ` install_${mori.get(install, 'task')}`
    } else {
      button_classes += ` uninstalled`
    }

    let button_style = {}
    if (install && mori.get(install, 'progress') > 0) {
      let percent = (mori.get(install, 'progress') * 100).toFixed() + '%'
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
      <div className={button_classes} style={button_style} onClick={() => AppActions.install_queue(mori.get(game, 'id'))}>
        {install
        ? (
          <span>
            <TaskIcon task={mori.get(install, 'task')}/> {this.status(install)}
          </span>
        )
        : <span><span className='icon icon-install'/> Install</span>
        }
      </div>
    </div>
  }

  status (install) {
    let task = mori.get(install, 'task')
    let progress = mori.get(install, 'progress')

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
    } else if (task === 'extract') {
      res = 'Extracting'
    }

    if (progress > 0) {
      res += ` (${(progress * 100).toFixed()}%)`
    }
    return res
  }
}

GameCell.propTypes = {
  game: PropTypes.object,
  install: PropTypes.object
}

class GameList extends React.Component {
  render () {
    let {games, installs} = this.props
    let index_by = (acc, k, v) => mori.assoc(acc, mori.get(v, 'game_id'), v)
    let installs_by_game_id = mori.reduceKV(index_by, mori.hashMap(), installs)

    return <div className='game_list'>
      {mori.intoArray(mori.map(game => {
        let game_id = mori.get(game, 'id')
        let install = mori.get(installs_by_game_id, game_id)
        return <GameCell key={game_id} game={game} install={install}/>
      }, games))}
    </div>
  }
}

GameList.propTypes = {
  games: PropTypes.any,
  installs: PropTypes.any
}

export {GameCell, GameList}
