import React from "react";
import GameStatusGetter from "renderer/basics/GameStatusGetter";
import { Game } from "common/butlerd/messages";
import MainAction from "renderer/basics/MainAction";

export default ({ game }: { game: Game }) => (
  <GameStatusGetter
    game={game}
    render={status => <MainAction game={game} status={status} />}
  />
);
