import * as messages from "common/butlerd/messages";
import { Task } from "common/types";
import { getActiveDownload } from "main/reactors/downloads/getters";
import { getActiveTask } from "main/reactors/tasks/getters";
import React from "react";
import { useAppSelector } from "renderer/hooks/redux";
import { useButlerd } from "renderer/hooks/useButlerd";
import PrimeDownloadContents from "renderer/scenes/HubScene/Sidebar/PrimeDownload/PrimeDownloadContents";

const TaskGame = ({ task }: { task: Task }) => {
  const { result } = useButlerd(messages.FetchGame, { gameId: task.gameId });

  if (!result?.game) {
    return null;
  }
  return (
    <PrimeDownloadContents
      game={result.game}
      kind="task"
      caveId={task.caveId}
      taskName={task.name}
    />
  );
};

const RecentGame = () => {
  const profileId = useAppSelector((rs) => rs.profile.profile?.id);
  const { result } = useButlerd(messages.FetchCaves, {
    limit: 1,
    sortBy: "lastTouched",
    profileId,
  });

  const cave = result?.items?.[0];
  if (!cave) {
    return null;
  }
  return (
    <PrimeDownloadContents game={cave.game} caveId={cave.id} kind="recent" />
  );
};

const PrimeDownload = () => {
  const task = useAppSelector((rs) => getActiveTask(rs.tasks));
  const download = useAppSelector((rs) => getActiveDownload(rs.downloads));
  const progress = useAppSelector((rs) => {
    const active = getActiveDownload(rs.downloads);
    return active ? rs.downloads.progresses[active.id] : null;
  });

  if (task && (task.name === "launch" || task.name === "uninstall")) {
    // keyed so the previous task's game doesn't show under this task
    return <TaskGame key={task.gameId} task={task} />;
  }

  if (download) {
    const caveId = download.finishedAt ? download.caveId : undefined;
    return (
      <PrimeDownloadContents
        game={download.game}
        kind="download"
        caveId={caveId}
        progress={progress}
      />
    );
  }

  return <RecentGame />;
};

export default PrimeDownload;
