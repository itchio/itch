
import * as React from "react";
import * as classNames from "classnames";
import {connect, I18nProps} from "./connect";

import {whenClickNavigates} from "./when-click-navigates";

import * as actions from "../actions";
import GameActions from "./game-actions";

import {IGameRecord, ICaveRecord} from "../types";
import {dispatcher, multiDispatcher} from "../constants/action-types";

export class HubItem extends React.Component<IProps & IDerivedProps & I18nProps, IState> {
  constructor () {
    super();
    this.state = {
      hover: false,
    };
  }

  onContextMenu () {
    const {game, openGameContextMenu} = this.props;
    openGameContextMenu({game});
  }

  onMouseDown (e: React.MouseEvent<any>) {
    const {game, navigateToGame} = this.props;
    whenClickNavigates(e, ({background}) => {
      navigateToGame(game, background);
    });
  }

  render () {
    const {game, searchScore, cave} = this.props;
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

    const actionProps = {game, showSecondary: this.state.hover, cave};
    const itemClasses = classNames("hub-item", {dull: (searchScore && searchScore > 0.2)});

    return <div className={itemClasses}
        onMouseEnter={this.onMouseEnter.bind(this)}
        onMouseLeave={this.onMouseLeave.bind(this)}
        onContextMenu={this.onContextMenu.bind(this)}>
      {gif
        ? <span className="gif-marker">gif</span>
        : ""
      }
      <section className="cover" style={coverStyle}
        onMouseDown={this.onMouseDown.bind(this)}/>

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

interface IProps {
  game: IGameRecord;
  cave?: ICaveRecord;
  searchScore?: number;
}

interface IDerivedProps {
  navigateToGame: typeof actions.navigateToGame;
  openGameContextMenu: typeof actions.openGameContextMenu;
}

interface IState {
  /** true if mouse is over this hub item */
  hover: boolean;
}

export default connect<IProps>(HubItem, {
  dispatch: (dispatch) => ({
    navigateToGame: multiDispatcher(dispatch, actions.navigateToGame),
    openGameContextMenu: dispatcher(dispatch, actions.openGameContextMenu),
  }),
});
