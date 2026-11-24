import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { Game } from "common/butlerd/messages";
import getGameStatus, {
  GameStatus,
  withOwnedAccess,
} from "common/helpers/get-game-status";
import { ambientWind } from "common/util/navigation";
import React, { useEffect } from "react";
import Filler from "renderer/basics/Filler";
import GameStats from "renderer/basics/GameStats";
import IconButton from "renderer/basics/IconButton";
import PlaylistAddIcon from "renderer/basics/icons/PlaylistAddIcon";
import MainAction from "renderer/basics/MainAction";
import { useAppDispatch, useAppSelector } from "renderer/hooks/redux";
import { useButlerd } from "renderer/hooks/useButlerd";
import { browserContextHeight } from "renderer/pages/BrowserPage/BrowserContext/BrowserContextConstants";
import StandardGameCover, {
  standardCoverHeight,
  standardCoverWidth,
} from "renderer/pages/common/StandardGameCover";
import styled from "renderer/styles";
import { _ } from "renderer/t";

const Spacer = styled.div`
  flex-basis: 16px;
  flex-shrink: 0;
`;

// round icon buttons have less visual mass than the main action, so they
// sit closer to each other than to it
const IconSpacer = styled.div`
  flex-basis: 8px;
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

interface ContextProps {
  game: Game;
  status: GameStatus;
  owned: boolean;
}

const Context = ({ game, status, owned }: ContextProps) => {
  const dispatch = useAppDispatch();

  const onContextMenu = (ev: React.MouseEvent<any>) => {
    ev.preventDefault();
    const { clientX, clientY } = ev;
    dispatch(
      actions.openGameContextMenu({
        wind: ambientWind(),
        game,
        forceOwned: owned,
        clientX,
        clientY,
      })
    );
  };

  return (
    <BrowserContextDiv
      onContextMenu={onContextMenu}
      role="region"
      aria-label="Game"
    >
      <SmallerGameCover game={game} showInfo={false} forceOwned={owned} />
      <Spacer />
      <GameStats game={game} status={status} />
      <Filler />
      <MainAction game={game} status={status} wide />
      <Spacer />
      <IconButton
        className="game-collections"
        huge
        emphasized
        icon={<PlaylistAddIcon />}
        hint={_("collection.dialog.hint")}
        onClick={() =>
          dispatch(actions.openGameCollectionsDialog({ gameId: game.id }))
        }
      />
      <IconSpacer />
      <IconButton
        className="manage-game"
        huge
        emphasized
        icon="cog"
        hint={_("game.manage")}
        onClick={() => dispatch(actions.manageGame({ game }))}
      />
    </BrowserContextDiv>
  );
};

// ownership can come from an owned bundle without a materialized
// download key, which commons (and thus getGameStatus) knows nothing
// about, so Fetch.GameOwnership is layered on top
const OwnershipContext = ({
  game,
  status,
  profileId,
}: {
  game: Game;
  status: GameStatus;
  profileId: number;
}) => {
  const { result } = useButlerd(messages.FetchGameOwnership, {
    profileId,
    gameId: game.id,
  });
  const owned = !!result?.owned;

  return (
    <Context
      game={game}
      status={owned ? withOwnedAccess(status) : status}
      owned={owned}
    />
  );
};

interface Props {
  game: Game;
}

const BrowserContextGame = ({ game }: Props) => {
  const dispatch = useAppDispatch();
  const status = useAppSelector((rs) => getGameStatus(rs, game));
  const profileId = useAppSelector((rs) => rs.profile.profile?.id);

  useEffect(() => {
    if (!status.operation && !status.update && status.cave) {
      // this logic is inferred from the onClick handler
      // defined in MainAction
      dispatch(
        actions.checkForGameUpdate({
          caveId: status.cave.id,
          suppressNotification: true,
        })
      );
    }
  }, []);

  if (!profileId) {
    return <Context game={game} status={status} owned={false} />;
  }
  return <OwnershipContext game={game} status={status} profileId={profileId} />;
};

export default BrowserContextGame;
