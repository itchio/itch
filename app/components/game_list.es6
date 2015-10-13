
import React from 'react'
import {PropTypes, Component} from 'react'
import classNames from 'classnames'

import AppActions from '../actions/app_actions'

class GameCell extends Component {
  render () {
    let {game} = this.props
    let {title, cover_url, user} = game
    let has_cover = !!cover_url

    let style = {
      backgroundImage: cover_url && `url('${cover_url}')`
    }

    return <div className='game_cell'>
      <div className='bordered'>
        <div className={classNames('game_thumb', {has_cover})} onClick={() => AppActions.view_game(game)} style={style}/>
      </div>
      <div className='game_title'>{title}</div>
      {user
      ? <div className='game_author'>{user.display_name}</div>
      : ''}
      <div className='game_launch button' onClick={() => AppActions.download_queue({game})}>
        <span className='icon icon-install'/> Install
      </div>
    </div>
  }
}

GameCell.propTypes = {
  game: PropTypes.object
}

class GameList extends React.Component {
  render () {
    let {games} = this.props
    if (!games) return <div/>

    return <div className='game_list'>
      {games.map(game => {
        return <GameCell key={game.id} game={game}/>
      })}
    </div>
  }
}

GameList.propTypes = {
  games: PropTypes.array
}

export {GameList}
