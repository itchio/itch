import React from "react";
import GameStatusGetter from "renderer/basics/GameStatusGetter";
import { Game } from "common/butlerd/messages";
import MainAction from "renderer/basics/MainAction";
import styled from "renderer/styles";

const UncollapsibleMainAction = styled(MainAction)`
  flex-shrink: 0;
`;

export default ({ game }: { game: Game }) => (
  <GameStatusGetter
    game={game}
    render={(status) => <UncollapsibleMainAction game={game} status={status} />}
  />
);
