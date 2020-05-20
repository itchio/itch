import { Game } from "@itchio/valet";
import { DownloadsState } from "common/downloads";
import { fileSize } from "common/format/filesize";
import { gameCover } from "common/game-cover";
import { OngoingLaunches } from "common/launches";
import _ from "lodash";
import React, { useState } from "react";
import { FormattedMessage } from "react-intl";
import { LaunchButton } from "renderer/basics/LaunchButton";
import { Spinner } from "renderer/basics/LoadingCircle";
import { TimeAgo } from "renderer/basics/TimeAgo";
import { ProgressBar } from "renderer/pages/ProgressBar";
import { InstallButton } from "renderer/Shell/InstallButton";
import { useCaves } from "renderer/use-caves";
import { useDownloadKeys } from "renderer/use-download-keys";
import { IconButton } from "renderer/basics/IconButton";
import { MenuTippy, MenuContents } from "renderer/basics/Menu";
import { Button } from "renderer/basics/Button";
import { useAsyncCb } from "renderer/use-async-cb";
import { useSocket } from "renderer/contexts";
import { modals } from "common/modals";
import { useClickOutside } from "renderer/basics/use-click-outside";

interface Props {
  game?: Game;
  launches: OngoingLaunches;
  downloads: DownloadsState;
}

type InternalProps = Props & {
  game: Game;
};

export const GameListDetail = (props: Props) => {
  if (!props.game) {
    return <Spinner />;
  }

  return <GameListDetailInternal {...props} game={props.game} />;
};

const GameListDetailInternal = (props: InternalProps) => {
  const { game, downloads } = props;
  const gameId = game.id;
  const caves = useCaves({ gameId });
  const lastCave = _.last(_.sortBy(caves, (c) => c.stats.lastTouchedAt));

  const keys = useDownloadKeys({ gameId });
  const lastKey = _.last(_.sortBy(keys, (k) => k.createdAt));

  const lastDownload = _.find(
    downloads,
    (d) => !d.finishedAt && d.game?.id == game?.id
  );

  const socket = useSocket();

  const [uninstallMenuOpen, setUninstallMenuOpen] = useState(false);
  useClickOutside(() => setUninstallMenuOpen(false));
  const [confirmUninstall] = useAsyncCb(async () => {
    await socket.showModal(modals.confirmUninstall, { gameId });
    setUninstallMenuOpen(false);
  }, [gameId, socket]);

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
              {lastCave ? (
                <>
                  <MenuTippy
                    visible={uninstallMenuOpen}
                    content={
                      <MenuContents>
                        <Button
                          icon="uninstall"
                          label={<FormattedMessage id="grid.item.uninstall" />}
                          onClick={confirmUninstall}
                        />
                      </MenuContents>
                    }
                    interactive
                    boundary="viewport"
                    placement="bottom"
                  >
                    <IconButton
                      icon="cog"
                      onClick={() => setUninstallMenuOpen(true)}
                    />
                  </MenuTippy>
                  <LaunchButton wide gameId={game.id} />
                </>
              ) : (
                <InstallButton wide gameId={game.id} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
