import React from "react";
import getGameStatus, { GameStatus } from "common/helpers/get-game-status";
import { Game } from "common/butlerd/messages";
import { connect } from "renderer/hocs/connect";
import { IRootState } from "common/types";

interface Props {
  game: Game;
  caveId?: string;
  render: (status: GameStatus) => JSX.Element;
}

interface DerivedProps {
  status: GameStatus;
}

class GameStatusGetter extends React.PureComponent<Props & DerivedProps> {
  render() {
    const { status, render } = this.props;
    return render(status);
  }
}

export default connect<Props>(
  GameStatusGetter,
  {
    state: (rs: IRootState, props: Props) => ({
      status: getGameStatus(rs, props.game, props.caveId),
    }),
  }
);
