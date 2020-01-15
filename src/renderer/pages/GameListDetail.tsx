import { Game } from "common/butlerd/messages";
import { DownloadsState } from "common/downloads";
import { gameCover } from "common/game-cover";
import { OngoingLaunches } from "common/launches";
import { queries } from "common/queries";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { IconButton } from "renderer/basics/IconButton";
import { Spinner } from "renderer/basics/LoadingCircle";
import { MenuTippy } from "renderer/basics/Menu";
import { TimeAgo } from "renderer/basics/TimeAgo";
import { useClickOutside } from "renderer/basics/useClickOutside";
import { useSocket } from "renderer/contexts";
import { InstallModalContents } from "renderer/Shell/InstallModal";
import { useAsyncCb } from "renderer/use-async-cb";
import { useCaves } from "renderer/use-caves";
import { useDownloadKeys } from "renderer/use-download-keys";
import { fileSize } from "common/format/filesize";
import { ProgressBar } from "renderer/pages/ProgressBar";
import { messages } from "common/butlerd";

interface Props {
  game?: Game;
  launches: OngoingLaunches;
  downloads: DownloadsState;
}

export const GameListDetail = (props: Props) => {
  const { game, launches, downloads } = props;
  if (!game) {
    return <Spinner />;
  }

  const socket = useSocket();

  const [screenshots, setScreenshots] = useState<string[]>([]);
  const backgroundImage = _.find(screenshots, s => !/\.gif/i.test(s));

  useEffect(() => {
    setScreenshots([]);
    if (!game) {
      return;
    }
    let cancelled = false;

    (async () => {
      const { screenshots } = await socket.call(
        messages.FetchScrapedScreenshots,
        {
          gameId: game.id,
        }
      );
      if (cancelled) {
        return;
      }
      setScreenshots(screenshots);
    })().catch(e => {
      setScreenshots([]);
      console.warn(e);
    });

    return () => {
      cancelled = true;
    };
  }, [game?.id]);

  const caves = useCaves({ gameId: game.id });
  const lastCave = _.last(_.sortBy(caves, c => c.stats.lastTouchedAt));

  const keys = useDownloadKeys({ gameId: game.id });
  const lastKey = _.last(_.sortBy(keys, k => k.createdAt));

  const lastLaunch = _.find(launches, l => l.gameId == game?.id);
  const lastDownload = _.find(
    downloads,
    d => !d.finishedAt && d.game?.id == game?.id
  );

  // close game install on game change (should already close
  // because of click outside, but ya never know)
  useEffect(() => {
    setGameBeingInstalled(undefined);
  }, [game?.id]);

  const [install] = useAsyncCb(async () => {
    if (!game) {
      return;
    }
    setGameBeingInstalled(game);
  }, [game?.id]);

  const [launch] = useAsyncCb(async () => {
    await socket.query(queries.launchGame, {
      gameId: game?.id,
    });
  }, [game?.id]);

  const [gameBeingInstalled, setGameBeingInstalled] = useState<
    Game | undefined
  >(undefined);
  const coref = useClickOutside(() => setGameBeingInstalled(undefined));

  return (
    <>
      <div
        className="detail-background"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, .9), rgba(0, 0, 0, .7))${
            backgroundImage ? `, url(${backgroundImage})` : ""
          }`,
        }}
      ></div>
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
              <MenuTippy
                placement="left-start"
                appendTo={document.body}
                interactive
                visible={!!gameBeingInstalled}
                content={
                  gameBeingInstalled ? (
                    <InstallModalContents
                      ref={coref("install-modal-contents")}
                      coref={coref}
                      game={gameBeingInstalled}
                      onClose={() => setGameBeingInstalled(undefined)}
                    />
                  ) : (
                    <></>
                  )
                }
              >
                {lastCave ? (
                  <IconButton wide icon="install" onClick={install} />
                ) : (
                  <Button
                    wide
                    icon="install"
                    label={<FormattedMessage id="grid.item.install" />}
                    onClick={install}
                    secondary
                  />
                )}
              </MenuTippy>
              {lastCave ? (
                <Button
                  wide
                  label={<FormattedMessage id="grid.item.launch" />}
                  onClick={launch}
                  disabled={!!lastLaunch}
                />
              ) : null}
            </div>
          </div>
        </div>
        <div className="screenshots">
          {screenshots.map((src, i) => {
            return <img key={src} src={src} />;
          })}
        </div>
      </div>
    </>
  );
};
