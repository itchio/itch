
import React from 'react'
import {PropTypes, Component} from 'react'
import classNames from 'classnames'
import {indexBy, values} from 'underscore'

import AppActions from '../actions/app-actions'

import {TaskIcon} from './misc'

class GameCell extends Component {
  render () {
    let {game, install} = this.props
    let {title, cover_url, user} = game
    let has_cover = !!cover_url

    let style = {
      backgroundImage: cover_url && `url('${cover_url}')`
    }

    let button_classes = 'game_launch button'
    if (install) {
      button_classes += ` install_${install.task}`
    } else {
      button_classes += ` uninstalled`
    }

    let button_style = {}
    if (install && install.progress > 0) {
      let percent = (install.progress * 100).toFixed() + '%'
      let done_color = '#444'
      let undone_color = '#222'
      button_style.backgroundImage = `-webkit-linear-gradient(left, ${done_color}, ${done_color} ${percent}, ${undone_color} ${percent}, ${undone_color})`
    }

    return <div className='game_cell'>
      <div className='bordered'>
        <div className={classNames('game_thumb', {has_cover})} onClick={() => require('remote').require('shell').openExternal(game.url)} style={style}/>
      </div>
      <div className='game_title'>{title}</div>
      {user
      ? <div className='game_author'>{user.display_name}</div>
      : ''}
      <div className={button_classes} style={button_style} onClick={() => AppActions.install_queue(game.id)}>
        {install
        ? (
          <span>
            <TaskIcon task={install.task}/> {this.status(install)}
          </span>
        )
        : <span><span className='icon icon-install'/> Install</span>
        }
      </div>
    </div>
  }

  status (install) {
    if (install.task === 'idle') {
      return 'Launch'
    }
    if (install.task === 'error') {
      return 'Broken'
    }
    if (install.task === 'launch') {
      return 'Running...'
    }

    let res = 'Installing...'
    if (install.task === 'download') {
      res = 'Downloading...'
    } else if (install.task === 'extract') {
      res = 'Extracting'
    }

    if (install.progress > 0) {
      res += ` (${(install.progress * 100).toFixed()}%)`
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
    let installs_by_game_id = indexBy(values(installs), 'game_id')
    if (!games) return <div/>

    return <div className='game_list'>
      {games.map(game => {
        let install = installs_by_game_id[game.id]
        return <GameCell key={game.id} game={game} install={install}/>
      })}
    </div>
  }
}

GameList.propTypes = {
  games: PropTypes.array,
  installs: PropTypes.object
}

export {GameCell, GameList}
