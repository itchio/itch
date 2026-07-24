import * as messages from "common/butlerd/messages";
import { Download, DownloadProgress } from "common/butlerd/messages";
import { Dispatch, Task } from "common/types";
import { getActiveDownload } from "main/reactors/downloads/getters";
import { getActiveTask } from "main/reactors/tasks/getters";
import React from "react";
import butlerCaller from "renderer/hocs/butlerCaller";
import { hook } from "renderer/hocs/hook";
import PrimeDownloadContents from "renderer/scenes/HubScene/Sidebar/PrimeDownload/PrimeDownloadContents";
import { first } from "underscore";

const FetchGame = butlerCaller(messages.FetchGame);
const FetchCaves = butlerCaller(messages.FetchCaves);

class PrimeDownload extends React.PureComponent<Props> {
  override render() {
    const { task } = this.props;
    if (task) {
      if (task.name === "launch" || task.name === "uninstall") {
        return (
          <FetchGame
            loadingHandled
            errorsHandled
            params={{ gameId: task.gameId }}
            render={this.renderGameForTask}
          />
        );
      }
    }

    const { download, progress } = this.props;
    if (download) {
      const { game } = download;
      const caveId = download.finishedAt ? download.caveId : undefined;
      return (
        <PrimeDownloadContents
          game={game}
          kind="download"
          caveId={caveId}
          progress={progress}
        />
      );
    }

    return (
      <FetchCaves
        loadingHandled
        errorsHandled
        params={{
          limit: 1,
          sortBy: "lastTouched",
          profileId: this.props.profileId,
        }}
        render={this.renderGameForCave}
      />
    );
  }

  renderGameForCave = FetchCaves.renderCallback(({ result }) => {
    if (result) {
      const { items } = result;
      const cave = first(items);
      if (cave) {
        const { game } = cave;
        return (
          <PrimeDownloadContents game={game} caveId={cave.id} kind="recent" />
        );
      }
    }
    return null;
  });

  renderGameForTask = FetchGame.renderCallback(({ result }) => {
    const { task } = this.props;
    if (result && result.game && task) {
      return (
        <PrimeDownloadContents
          game={result.game}
          kind="task"
          caveId={task.caveId}
          taskName={task.name}
        />
      );
    }
    return null;
  });
}

interface Props {
  task: Task | undefined;
  dispatch: Dispatch;
  download: Download | undefined;
  progress: DownloadProgress | null;
  profileId: number | undefined;
}

export default hook((map) => ({
  task: map((rs) => getActiveTask(rs.tasks)),
  download: map((rs) => getActiveDownload(rs.downloads)),
  profileId: map((rs) => rs.profile.profile?.id),
  progress: map((rs): DownloadProgress | null => {
    const active = getActiveDownload(rs.downloads);
    if (active) {
      return rs.downloads.progresses[active.id];
    }
    return null;
  }),
}))(PrimeDownload);
