
import * as React from "react";
import {connect, I18nProps} from "./connect";

import {whenClickNavigates} from "./when-click-navigates";

import * as actions from "../actions";
import GameActions from "./game-actions";
import Cover from "./basics/cover";

import GameModel from "../db/models/game";
import {dispatcher, multiDispatcher} from "../constants/action-types";

import styled, * as styles from "./styles";

export class HubItem extends React.PureComponent<IProps & IDerivedProps & I18nProps, IState> {
  constructor () {
    super();
    this.state = {
      hover: false,
    };
  }

  onContextMenu = () => {
    const {game, openGameContextMenu} = this.props;
    openGameContextMenu({game});
  }

  onMouseDown = (e: React.MouseEvent<any>) => {
    const {game, navigateToGame} = this.props;
    whenClickNavigates(e, ({background}) => {
      navigateToGame(game, background);
    });
  }

  render () {
    const {game} = this.props;
    const {hover} = this.state;
    const {title, coverUrl, stillCoverUrl} = game;

    const actionProps = {game, showSecondary: this.state.hover};

    return <HubItemDiv
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
        onContextMenu={this.onContextMenu}>
      <Cover
        coverUrl={coverUrl}
        stillCoverUrl={stillCoverUrl}
        hover={hover}
        onClick={this.onMouseDown}
      />

      <UnderCover>
        <section className="title">
          {title}
        </section>

        <GameActions {...actionProps}/>
      </UnderCover>
    </HubItemDiv>;
  }

  onMouseEnter = () => {
    this.setState({hover: true});
  }

  onMouseLeave = () => {
    this.setState({hover: false});
  }
}

const HubItemDiv = styled.div`
  ${styles.inkContainer()};
  ${styles.hubItemStyle()};
  margin: .5em;
  cursor: default;

  &.dull {
    -webkit-filter: grayscale(95%);
    opacity: .4;
  }
`;

const UnderCover = styled.div`
  display: flex;
  flex-direction: column;
  align-items: start;

  padding: 0.5em 0.5em 0.25em 0.5em;

  .title {
    ${styles.singleLine()};
    font-size: ${styles.fontSizes.large};
    padding: .4em 0;
    margin: 0 0 4px 0;
    text-shadow: 0 0 1px ${props => props.theme.inputTextShadow};
  }
`;

interface IProps {
  game: GameModel;
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
