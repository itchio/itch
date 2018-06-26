import React from "react";
import styled from "renderer/styles";

import { Game } from "common/butlerd/messages";
import { RootState } from "common/types";
import { createStructuredSelector } from "reselect";
import getGameStatus, { GameStatus } from "common/helpers/get-game-status";
import MainAction from "renderer/basics/MainAction";
import { Dispatch } from "redux";
import { actions } from "common/actions";
import { withDispatch } from "renderer/hocs/withDispatch";
import { connect } from "renderer/hocs/connect";
import GameStats from "renderer/basics/GameStats";
import Filler from "renderer/basics/Filler";
import IconButton from "renderer/basics/IconButton";

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

class _BrowserContextGame extends React.PureComponent<Props & DerivedProps> {
  render() {
    const { game, status } = this.props;

    return (
      <BrowserContextDiv>
        <MainAction game={game} status={status} wide />
        <Spacer />
        <GameStats game={game} status={status} />
        <Filler />
        <IconButton
          className="manage-game"
          huge
          emphasized
          icon="cog"
          onClick={this.onManage}
        />
      </BrowserContextDiv>
    );
  }

  onManage = () => {
    const { game, dispatch } = this.props;
    dispatch(actions.manageGame({ game }));
  };
}

interface Props {
  game: Game;
  dispatch: Dispatch<any>;
}

interface DerivedProps {
  status: GameStatus;
}

const BrowserContextGame = withDispatch(
  connect<Props>(
    _BrowserContextGame,
    {
      state: createStructuredSelector({
        status: (rs: RootState, props: Props) => getGameStatus(rs, props.game),
      }),
    }
  )
);

export default BrowserContextGame;
