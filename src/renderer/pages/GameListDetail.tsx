import { Game } from "common/butlerd/messages";
import { DownloadsState } from "common/downloads";
import { fileSize } from "common/format/filesize";
import { gameCover } from "common/game-cover";
import { OngoingLaunches } from "common/launches";
import _ from "lodash";
import React from "react";
import { FormattedMessage } from "react-intl";
import { LaunchButton } from "renderer/basics/LaunchButton";
import { Spinner } from "renderer/basics/LoadingCircle";
import { TimeAgo } from "renderer/basics/TimeAgo";
import { ProgressBar } from "renderer/pages/ProgressBar";
import { InstallButton } from "renderer/Shell/InstallButton";
import { useCaves } from "renderer/use-caves";
import { useDownloadKeys } from "renderer/use-download-keys";

interface Props {
  game?: Game;
  launches: OngoingLaunches;
  downloads: DownloadsState;
}

export const GameListDetail = (props: Props) => {
  const { game, downloads } = props;
  if (!game) {
    return <Spinner />;
  }

  const caves = useCaves({ gameId: game.id });
  const lastCave = _.last(_.sortBy(caves, c => c.stats.lastTouchedAt));

  const keys = useDownloadKeys({ gameId: game.id });
  const lastKey = _.last(_.sortBy(keys, k => k.createdAt));

  const lastDownload = _.find(
    downloads,
    d => !d.finishedAt && d.game?.id == game?.id
  );

  return (
    <>
      <div className="detail-content">
        <div className="header">
          <div className="info">
            <h3>{game.title}</h3>
            <p className="short-text">{game.shortText}</p>
            {lastCave ? (
              <p className="secondary">
                <FormattedMessage
                  id="usage_stats.description.installed_time_ago"
                  values={{
                    time_ago: <TimeAgo date={lastCave.stats.installedAt} />,
                  }}
                />
              </p>
            ) : null}
            {lastDownload ? (
              <p className="download">
                <FormattedMessage id="grid.item.installing" />{" "}
                {lastDownload.progress?.bps ? (
                  <>@ {fileSize(lastDownload.progress?.bps)} / s</>
                ) : null}{" "}
                <ProgressBar progress={lastDownload.progress?.progress ?? 0} />
              </p>
            ) : null}
            {lastKey ? (
              <p className="secondary">
                <FormattedMessage
                  id="usage_stats.description.bought_time_ago"
                  values={{ time_ago: <TimeAgo date={lastKey.createdAt} /> }}
                />
              </p>
            ) : null}
          </div>
          <div className="cover-section">
            <a href={game.url ?? `itch://games/${game.id}`}>
              {gameCover(game) ? (
                <img src={gameCover(game)} />
              ) : (
                <div className="placeholder" />
              )}
            </a>
            <div className="controls">
              <InstallButton wide gameId={game.id} />
              {lastCave ? <LaunchButton wide gameId={game.id} /> : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
