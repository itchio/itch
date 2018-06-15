import React from "react";
import styled from "./styles";

import { Game } from "common/butlerd/messages";
import { IRootState } from "common/types";
import { createStructuredSelector } from "reselect";
import getGameStatus, { IGameStatus } from "common/helpers/get-game-status";
import MainAction from "./game-actions/main-action";
import GameStats from "./game-stats";
import Filler from "./basics/filler";
import IconButton from "./basics/icon-button";
import { Dispatch } from "redux";
import { withDispatch } from "./dispatch-provider";
import { connect } from "./connect";
import { actions } from "common/actions";

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
  status: IGameStatus;
}

const BrowserContextGame = withDispatch(
  connect<Props>(
    _BrowserContextGame,
    {
      state: createStructuredSelector({
        status: (rs: IRootState, props: Props) => getGameStatus(rs, props.game),
      }),
    }
  )
);

export default BrowserContextGame;
