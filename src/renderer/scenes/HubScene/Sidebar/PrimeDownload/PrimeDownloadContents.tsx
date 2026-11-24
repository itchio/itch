import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { Game } from "common/butlerd/messages";
import { formatTask, taskIcon } from "common/format/operation";
import { ProgressInfo, TaskName } from "common/types";
import { ambientWind } from "common/util/navigation";
import React from "react";
import ErrorState from "renderer/basics/ErrorState";
import DownloadProgressSpan from "renderer/basics/DownloadProgressSpan";
import Icon from "renderer/basics/Icon";
import LoadingCircle from "renderer/basics/LoadingCircle";
import LoadingState from "renderer/basics/LoadingState";
import { rcall } from "renderer/butlerd/rcall";
import { doAsync } from "renderer/helpers/doAsync";
import { useAppDispatch, useAppSelector } from "renderer/hooks/redux";
import { useButlerd } from "renderer/hooks/useButlerd";
import { GameTitle } from "renderer/scenes/HubScene/Sidebar/PrimeDownload/GameTitle";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import LastPlayed from "renderer/basics/LastPlayed";
import StandardGameCover from "renderer/pages/common/StandardGameCover";
import { getCaveSummary } from "common/butlerd/utils";

const CompactLastPlayed = styled(LastPlayed)`
  max-width: 90%;
  text-align: center;
  line-height: 1.2;
`;

type Kind = "download" | "task" | "recent";

const TitleBlock = styled.div`
  flex-shrink: 0;
  height: 40px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const EnormousIcon = styled(Icon)`
  font-size: ${(props) => props.theme.fontSizes.enormous};
`;

const GameCover = styled(StandardGameCover)`
  position: relative;
  pointer-events: none;

  overflow: hidden;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
`;

const PrimeDownloadButton = styled.button`
  ${styles.resetButton};
  ${styles.clickable};

  margin: 20px auto;

  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Overlay = styled.div`
  background: rgba(0, 0, 0, 0.8);
  position: absolute;

  left: 0;
  right: 0;
  bottom: 0;
  top: 0;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
`;

const ProgressContainer = styled.div`
  height: 50px;
  margin: 16px 0;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const CaveLastPlayed = ({ caveId, game }: { caveId: string; game: Game }) => {
  const profileId = useAppSelector((rs) => rs.profile.profile?.id);
  const { loading, error, result } = useButlerd(messages.FetchCave, {
    caveId,
    profileId,
  });

  if (loading && !result) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState error={error} />;
  }
  if (!result?.cave) {
    return null;
  }
  return <CompactLastPlayed cave={getCaveSummary(result.cave)} game={game} />;
};

interface Props {
  game: Game;
  kind: Kind;
  taskName?: TaskName;
  caveId?: string | null;
  progress?: ProgressInfo | null;
}

const Progress = ({ game, taskName, caveId, progress }: Props) => {
  const downloadsPaused = useAppSelector((rs) => rs.downloads.paused);

  if (taskName) {
    return (
      <>
        <ProgressContainer>
          <EnormousIcon icon={taskIcon(taskName)} />
        </ProgressContainer>
        <TitleBlock>{T(formatTask(taskName))}</TitleBlock>
      </>
    );
  }

  if (caveId) {
    return (
      <>
        <ProgressContainer>
          <EnormousIcon icon="play2" />
        </ProgressContainer>
        <TitleBlock>
          <CaveLastPlayed key={caveId} caveId={caveId} game={game} />
        </TitleBlock>
      </>
    );
  }

  if (!progress) {
    return (
      <>
        <ProgressContainer>
          <EnormousIcon icon="stopwatch" />
        </ProgressContainer>
        <TitleBlock>{T(["grid.item.queued"])}</TitleBlock>
      </>
    );
  }

  return (
    <>
      <ProgressContainer>
        <LoadingCircle progress={progress.progress} huge />
      </ProgressContainer>
      <TitleBlock>
        <DownloadProgressSpan {...progress} downloadsPaused={downloadsPaused} />
      </TitleBlock>
    </>
  );
};

const PrimeDownloadContents = (props: Props) => {
  const { game, kind, taskName, caveId } = props;
  const dispatch = useAppDispatch();

  const onMainClick = () => {
    doAsync(async () => {
      if (kind === "task") {
        if (taskName === "launch") {
          dispatch(actions.forceCloseGameRequest({ game }));
        }
        return;
      }

      if (caveId) {
        try {
          const { cave } = await rcall(messages.FetchCave, {
            caveId,
          });
          if (cave) {
            dispatch(actions.queueLaunch({ cave }));
            return;
          }
        } catch {}
      }

      dispatch(
        actions.navigate({
          wind: ambientWind(),
          url: "itch://downloads",
        })
      );
    });
  };

  const onContextMenu = (ev: React.MouseEvent<any>) => {
    ev.preventDefault();
    const { clientX, clientY } = ev;
    dispatch(
      actions.openGameContextMenu({
        wind: ambientWind(),
        game,
        clientX,
        clientY,
      })
    );
  };

  return (
    <PrimeDownloadButton
      type="button"
      onClick={onMainClick}
      onContextMenu={onContextMenu}
    >
      <GameCover game={game} showGifMarker={false} disableLink>
        <Overlay>
          <TitleBlock>
            <GameTitle title={game.title} />
          </TitleBlock>
          <Progress {...props} />
        </Overlay>
      </GameCover>
    </PrimeDownloadButton>
  );
};

export default PrimeDownloadContents;
