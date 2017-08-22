import * as React from "react";
import { connect } from "./connect";

import MainAction from "./game-actions/main-action";
import GameStats from "./game-stats";
import Filler from "./basics/filler";
import IconButton from "./basics/icon-button";

import { IGame } from "../db/models/game";

import { IDispatch, dispatcher } from "../constants/action-types";
import { IAppState } from "../types";
import * as actions from "../actions";

import { IBrowserControlProps } from "./browser-state";

import styled from "./styles";

import { Space } from "../helpers/space";
import getGameStatus, { IGameStatus } from "../helpers/get-game-status";

const Spacer = styled.div`
  flex-basis: 10px;
  flex-shrink: 0;
`;

const BrowserContextDiv = styled.div`
  background: ${props => props.theme.sidebarBackground};

  display: flex;
  justify-content: center;
  flex-direction: row;

  padding: 10px;
  box-shadow: 0 0 18px rgba(0, 0, 0, 0.16);
  z-index: 50;
  align-items: center;
`;

export class GameBrowserContext extends React.PureComponent<
  IProps & IDerivedProps
> {
  constructor() {
    super();
    this.state = {};
  }

  render() {
    const { game, status } = this.props;
    if (!game) {
      return <div />;
    }

    return (
      <BrowserContextDiv onContextMenu={this.onContextMenu}>
        <MainAction game={game} status={status} wide />
        <Spacer />
        <GameStats game={game} status={status} />
        <Filler />
        <IconButton
          huge
          emphasized
          icon="more_vert"
          onClick={this.onContextMenu}
        />
      </BrowserContextDiv>
    );
  }

  onContextMenu = (ev: React.MouseEvent<any>) => {
    const { game, openGameContextMenu } = this.props;
    openGameContextMenu({ game, x: ev.pageX, y: ev.pageY });
  };
}

interface IProps extends IBrowserControlProps {}

interface IDerivedProps {
  game: IGame;
  status: IGameStatus;

  openGameContextMenu: typeof actions.openGameContextMenu;
}

export default connect<IProps>(GameBrowserContext, {
  state: (rs: IAppState, props: IProps) => {
    const game = Space.from(rs, props.tab).game();
    if (!game) {
      return {};
    }

    return {
      game,
      status: getGameStatus(rs, game),
    };
  },
  dispatch: (dispatch: IDispatch) => ({
    openGameContextMenu: dispatcher(dispatch, actions.openGameContextMenu),
  }),
});
