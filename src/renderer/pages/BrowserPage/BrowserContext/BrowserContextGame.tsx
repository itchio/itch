import { actions } from "common/actions";
import { Game } from "common/butlerd/messages";
import getGameStatus, { GameStatus } from "common/helpers/get-game-status";
import { ambientWind } from "common/util/navigation";
import React from "react";
import { Dispatch } from "redux";
import Filler from "renderer/basics/Filler";
import GameStats from "renderer/basics/GameStats";
import IconButton from "renderer/basics/IconButton";
import MainAction from "renderer/basics/MainAction";
import { hookWithProps } from "renderer/hocs/hook";
import { browserContextHeight } from "renderer/pages/BrowserPage/BrowserContext/BrowserContextConstants";
import StandardGameCover, {
  standardCoverHeight,
  standardCoverWidth,
} from "renderer/pages/common/StandardGameCover";
import styled from "renderer/styles";

const Spacer = styled.div`
  flex-basis: 16px;
  flex-shrink: 0;
`;

const coverFactor = browserContextHeight / standardCoverHeight;

const SmallerGameCover = styled(StandardGameCover)`
  flex-shrink: 0;

  width: ${standardCoverWidth * coverFactor}px;
  height: ${standardCoverHeight * coverFactor}px;
`;

const BrowserContextDiv = styled.div`
  background: ${(props) => props.theme.sidebarBackground};

  display: flex;
  justify-content: center;
  flex-direction: row;

  padding-right: 16px;
  box-shadow: 0 0 18px rgba(0, 0, 0, 0.16);
  z-index: 50;
  align-items: center;
`;

class BrowserContextGame extends React.PureComponent<Props> {
  render() {
    const { game, status } = this.props;

    return (
      <BrowserContextDiv onContextMenu={this.onContextMenu}>
        <SmallerGameCover game={game} showInfo={false} />
        <Spacer />
        <GameStats game={game} status={status} />
        <Filler />
        <MainAction game={game} status={status} wide />
        <Spacer />
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

  onContextMenu = (ev: React.MouseEvent<any>) => {
    ev.preventDefault();
    const { clientX, clientY } = ev;
    const { game, dispatch } = this.props;
    dispatch(
      actions.openGameContextMenu({
        wind: ambientWind(),
        game,
        clientX,
        clientY,
      })
    );
  };

  onManage = () => {
    const { game, dispatch } = this.props;
    dispatch(actions.manageGame({ game }));
  };
}

interface Props {
  game: Game;
  dispatch: Dispatch<any>;

  status: GameStatus;
}

export default hookWithProps(BrowserContextGame)((map) => ({
  status: map((rs, props) => getGameStatus(rs, props.game)),
}))(BrowserContextGame);
