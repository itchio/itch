import GameStatusGetter from "renderer/basics/GameStatusGetter";
import { Game } from "common/butlerd/messages";
import { withOwnedAccess } from "common/helpers/get-game-status";
import MainAction from "renderer/basics/MainAction";
import styled from "renderer/styles";

const UncollapsibleMainAction = styled(MainAction)`
  flex-shrink: 0;
`;

// `forceOwned` treats the game as owned even when commons has no download
// key for it — used in owned-bundle contexts, where the key is only
// materialized on first install.
export default ({ game, forceOwned }: { game: Game; forceOwned?: boolean }) => (
  <GameStatusGetter
    game={game}
    render={(status) => (
      <UncollapsibleMainAction
        game={game}
        status={forceOwned ? withOwnedAccess(status) : status}
      />
    )}
  />
);
