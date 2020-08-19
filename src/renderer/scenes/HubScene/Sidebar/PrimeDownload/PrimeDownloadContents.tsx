import { actions } from "common/actions";
import { messages, getCaveSummary } from "common/butlerd";
import { Game } from "common/butlerd/messages";
import { formatTask, taskIcon } from "common/format/operation";
import { Dispatch, ProgressInfo, TaskName } from "common/types";
import { ambientWind } from "common/util/navigation";
import React from "react";
import DownloadProgressSpan from "renderer/basics/DownloadProgressSpan";
import Icon from "renderer/basics/Icon";
import IconButton from "renderer/basics/IconButton";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { rcall } from "renderer/butlerd/rcall";
import { doAsync } from "renderer/helpers/doAsync";
import { hook } from "renderer/hocs/hook";
import { GameTitle } from "renderer/scenes/HubScene/Sidebar/PrimeDownload/GameTitle";
import styled, { clickable } from "renderer/styles";
import { T } from "renderer/t";
import LastPlayed from "renderer/basics/LastPlayed";
import butlerCaller from "renderer/hocs/butlerCaller";
import StandardGameCover from "renderer/pages/common/StandardGameCover";

const FetchCave = butlerCaller(messages.FetchCave);

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

const PrimeDownloadDiv = styled.div`
  ${clickable};

  margin: 20px auto;
  padding-bottom: 1em;

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

class PrimeDownloadContents extends React.PureComponent<Props> {
  render() {
    const { game } = this.props;
    return (
      <PrimeDownloadDiv
        onClick={this.onMainClick}
        onContextMenu={this.onContextMenu}
      >
        <GameCover game={game} showGifMarker={false}>
          <Overlay>
            <TitleBlock>
              <GameTitle title={game.title} />
            </TitleBlock>
            {this.renderProgress()}
          </Overlay>
        </GameCover>
      </PrimeDownloadDiv>
    );
  }

  onMainClick = () => {
    doAsync(async () => {
      const { dispatch, kind, game, taskName, caveId } = this.props;

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
          dispatch(actions.queueLaunch({ cave }));
          return;
        } catch (e) {}
      }

      dispatch(
        actions.navigate({
          wind: ambientWind(),
          url: "itch://downloads",
        })
      );
    });
  };

  renderProgress(): JSX.Element {
    const { progress, downloadsPaused, caveId, taskName, game } = this.props;
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

    if (!progress && !caveId) {
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
          {caveId ? (
            <IconButton icon="play2" enormous />
          ) : (
            <LoadingCircle progress={progress.progress} huge />
          )}
        </ProgressContainer>
        {caveId ? (
          <TitleBlock>
            <FetchCave params={{ caveId }} render={this.renderLastPlayed} />
          </TitleBlock>
        ) : (
          <TitleBlock>
            <DownloadProgressSpan
              {...progress}
              downloadsPaused={downloadsPaused}
            />
          </TitleBlock>
        )}
      </>
    );
  }

  renderLastPlayed = FetchCave.renderCallback(({ result }) => {
    if (result && result.cave) {
      const { cave } = result;
      const { game } = this.props;
      return <CompactLastPlayed cave={getCaveSummary(cave)} game={game} />;
    }
    return null;
  });

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
}

interface Props {
  game: Game;
  kind: Kind;
  taskName?: TaskName;
  caveId?: string;
  progress?: ProgressInfo;

  downloadsPaused: boolean;
  dispatch: Dispatch;
}

export default hook((map) => ({
  downloadsPaused: map((rs) => rs.downloads.paused),
}))(PrimeDownloadContents);
