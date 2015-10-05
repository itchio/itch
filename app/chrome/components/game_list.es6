
import React from "react";
import classNames from "classnames";

let remote = window.require("remote");
let AppActions = remote.require("./metal/actions/app_actions")

class GameCell extends React.Component {
  constructor() {
    super();
    this.view_game = this.view_game.bind(this);
    this.download = this.download.bind(this);
  }

  render() {
    let {game} = this.props;
    let {title, cover_url, user} = game;
    let has_cover = !!cover_url;

    let style = {
      backgroundImage: cover_url && `url('${cover_url}')`
    };

    return <div className="game_cell">
      <div className="bordered">
        <div className={classNames("game_thumb", {has_cover})} onClick={this.view_game} style={style}/>
      </div>
      <div className="game_title">{title}</div>
      {user ?
        <div className="game_author">{user.display_name}</div>
      :''}
      <div className="game_launch button" onClick={this.download}>
        <span className="icon icon-install"/> Install
      </div>
    </div>;
  }

  // non-React methods
  
  view_game() {
    AppActions.view_game(this.props.game);
  }

  download() {
    AppActions.download_queue({game: this.props.game});
  }

}

class GameList extends React.Component {
  render() {
    let {games} = this.props;
    if (!games) return <div/>;

    return <div className="game_list">
      {games.map(game => {
        return <GameCell key={game.id} game={game}/>
      })}
    </div>;
  }
}

export {GameList};

