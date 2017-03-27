
import * as React from "react";
import * as classNames from "classnames";

import {connect} from "./connect";

import doesEventMeanBackground from "./does-event-mean-background";

import * as actions from "../actions";
import GameActions from "./game-actions";

import {IGameRecord} from "../types";
import {IDispatch, dispatcher, multiDispatcher} from "../constants/action-types";

export class HubItem extends React.Component<IHubItemProps, IHubItemState> {
  constructor () {
    super();
    this.state = {
      hover: false,
    };

    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  onContextMenu () {
    const {game, openGameContextMenu} = this.props;
    openGameContextMenu({game});
  }

  onMouseUp (e: React.MouseEvent<any>) {
    console.log("mouse button: ", e.button);
    if (e.button === 0) {
      const {game, navigateToGame} = this.props;
      navigateToGame(game, doesEventMeanBackground(e));
    }
  }

  render () {
    const {game, searchScore} = this.props;
    const {title, coverUrl, stillCoverUrl} = game;

    let gif: boolean;
    const coverStyle: React.CSSProperties = {};
    if (coverUrl) {
      if (this.state.hover) {
        coverStyle.backgroundImage = `url('${coverUrl}')`;
      } else {
        if (stillCoverUrl) {
          gif = true;
          coverStyle.backgroundImage = `url('${stillCoverUrl}')`;
        } else {
          coverStyle.backgroundImage = `url('${coverUrl}')`;
        }
      }
    }

    const actionProps = {game, showSecondary: this.state.hover};
    const itemClasses = classNames("hub-item", {dull: (searchScore && searchScore > 0.2)});

    return <div className={itemClasses}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
        onContextMenu={this.onContextMenu}>
      {gif
        ? <span className="gif-marker">gif</span>
        : ""
      }
      <section className="cover" style={coverStyle}
        onMouseUp={this.onMouseUp}/>

      <section className="undercover">
        <section className="title">
          {title}
        </section>

        <GameActions {...actionProps}/>
      </section>
    </div>;
  }

  onMouseEnter () {
    this.setState({hover: true});
  }

  onMouseLeave () {
    this.setState({hover: false});
  }
}

interface IHubItemProps {
  game: IGameRecord;
  searchScore?: number;

  navigateToGame: typeof actions.navigateToGame;
  openGameContextMenu: typeof actions.openGameContextMenu;
}

interface IHubItemState {
  /** true if mouse is over this hub item */
  hover: boolean;
}

const mapStateToProps = () => ({});

const mapDispatchToProps = (dispatch: IDispatch) => ({
  navigateToGame: multiDispatcher(dispatch, actions.navigateToGame),
  openGameContextMenu: dispatcher(dispatch, actions.openGameContextMenu),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(HubItem);
