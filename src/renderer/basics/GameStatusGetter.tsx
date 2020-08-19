import React from "react";
import getGameStatus, { GameStatus } from "common/helpers/get-game-status";
import { Game } from "common/butlerd/messages";
import { hookWithProps } from "renderer/hocs/hook";

interface Props {
  game: Game;
  caveId?: string;
  render: (status: GameStatus) => JSX.Element;

  status: GameStatus;
}

class GameStatusGetter extends React.PureComponent<Props> {
  render() {
    const { status, render } = this.props;
    return render(status);
  }
}

export default hookWithProps(GameStatusGetter)((map) => ({
  status: map((rs, props) => getGameStatus(rs, props.game, props.caveId)),
}))(GameStatusGetter);
