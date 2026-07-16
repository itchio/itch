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
// `caveId` scopes the action to a specific install: status reflects that
// cave and launching targets it directly instead of asking which one.
export default ({
  game,
  caveId,
  forceOwned,
}: {
  game: Game;
  caveId?: string;
  forceOwned?: boolean;
}) => (
  <GameStatusGetter
    game={game}
    caveId={caveId}
    render={(status) => (
      <UncollapsibleMainAction
        game={game}
        caveId={caveId}
        status={forceOwned ? withOwnedAccess(status) : status}
      />
    )}
  />
);
