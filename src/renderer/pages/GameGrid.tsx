import { messages } from "common/butlerd";
import { Game, GameRecord, Download } from "common/butlerd/messages";
import { queries } from "common/queries";
import React, { useState, useEffect } from "react";
import { useAsyncCallback } from "react-async-hook";
import { Button } from "renderer/basics/Button";
import { IconButton } from "renderer/basics/IconButton";
import { MenuTippy } from "renderer/basics/Menu";
import { useSocket } from "renderer/contexts";
import { InstallModalContents } from "renderer/Shell/InstallModal";
import { mixins } from "renderer/theme";
import styled from "styled-components";
import { useClickOutside } from "renderer/basics/useClickOutside";
import { useListen } from "renderer/Socket";
import { packets } from "common/packets";
import _ from "lodash";
import { DownloadWithProgress } from "main/drive-downloads";
import { LoadingCircle } from "renderer/basics/LoadingCircle";

let coverBorder = 1;
const coverWidth = 300;
const coverHeight = 215;
let ratio = 0.9;

const GameGridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    ${coverWidth * ratio + coverBorder * 2}px
  );
  grid-row-gap: 2em;
  grid-column-gap: 1em;
  justify-content: space-evenly;

  & > .item {
    background: #202020;
    border: 1px solid #333;
    border-radius: 4px;

    .cover {
      width: ${coverWidth * ratio}px;
      height: ${coverHeight * ratio}px;

      &.missing {
        background-image: linear-gradient(12deg, #121212 0%, #191919 100%);
      }
    }

    & > .title {
      padding: 4px 8px;
      ${mixins.singleLine};
    }

    .buttons {
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 8px;

      .filler {
        flex-grow: 1;
      }
    }

    & > .title,
    & > .buttons {
      padding-left: 12px;
    }
  }
`;

const findGameId = (el: HTMLElement): number | undefined => {
  if (el.dataset.gameId) {
    return Number(el.dataset.gameId);
  }

  if (el.parentElement) {
    return findGameId(el.parentElement);
  }
  return undefined;
};

interface Downloads {
  [gameId: number]: DownloadWithProgress;
}

export const GameGrid = function(props: { records: GameRecord[] }) {
  const socket = useSocket();

  const [downloads, setDownloads] = useState<Downloads>({});
  const mergeDownloads = (fresh: Downloads) => {
    console.log(`Merging `, fresh);
    setDownloads({ ...downloads, ...fresh });
  };

  const [gameIdLoading, setGameIdLoading] = useState<number | undefined>();
  const [gameBeingInstalled, setGameBeingInstalled] = useState<
    Game | undefined
  >();
  const coref = useClickOutside(() => {
    setGameBeingInstalled(undefined);
  });

  const launch = useAsyncCallback(async function(
    ev: React.MouseEvent<HTMLButtonElement>
  ) {
    const gameId = findGameId(ev.currentTarget);
    if (!gameId) {
      return;
    }
    await socket.query(queries.launchGame, { gameId });
  });

  const install = useAsyncCallback(async function(
    ev: React.MouseEvent<HTMLButtonElement>
  ) {
    const gameId = findGameId(ev.currentTarget);
    if (!gameId) {
      return;
    }
    try {
      setGameIdLoading(gameId);
      const { game } = await socket.call(messages.FetchGame, { gameId });
      setGameBeingInstalled(game);
    } finally {
      setGameIdLoading(undefined);
    }
  });

  const purchase = useAsyncCallback(async function(
    ev: React.MouseEvent<HTMLButtonElement>
  ) {
    const gameId = findGameId(ev.currentTarget);
    if (!gameId) {
      return;
    }

    try {
      const { game } = await socket.callWithRefresh(messages.FetchGame, {
        gameId,
      });
      if (game) {
        location.href = `${game.url}/purchase`;
      }
    } catch (e) {
      console.warn(e);
    }
  });

  const uninstall = useAsyncCallback(async function(
    ev: React.MouseEvent<HTMLButtonElement>
  ) {
    const gameId = findGameId(ev.currentTarget);
    if (!gameId) {
      return;
    }

    alert("stub!");
  });

  useEffect(() => {
    (async () => {
      const { downloads } = await socket.query(queries.getDownloads);
      mergeDownloads(_.keyBy(downloads, d => d.game.id));
    })().catch(e => console.warn(e));
  }, []);

  let downloadChanged = ({ download }: { download: Download }) => {
    mergeDownloads({ [download.game.id]: download });
  };
  useListen(socket, packets.downloadStarted, downloadChanged);
  useListen(socket, packets.downloadChanged, downloadChanged);
  useListen(socket, packets.downloadCleared, ({ download }) => {
    setDownloads(_.omit(downloads, download.game.id));
  });

  let makeButton = (game: GameRecord, icon: boolean): JSX.Element => {
    if (icon) {
      return <IconButton icon="install" onClick={install.execute} />;
    } else {
      return (
        <Button
          icon="install"
          label="Install"
          loading={game.id == gameIdLoading}
          onClick={install.execute}
          secondary={game.id == gameBeingInstalled?.id}
        />
      );
    }
  };

  const { records } = props;
  return (
    <>
      <GameGridContainer>
        {records.map(game => {
          const dl = downloads[game.id];
          return (
            <div className="item" key={game.id} data-game-id={game.id}>
              <a href={`itch://games/${game.id}`}>
                {game.cover ? (
                  <img className="cover" src={game.cover} />
                ) : (
                  <div className="cover missing" />
                )}
              </a>
              {dl ? (
                dl.progress ? (
                  <p>
                    {dl.progress.stage} &mdash; {dl.progress.bps} bps &mdash;{" "}
                    {dl.progress.eta} ETA
                    <LoadingCircle progress={dl.progress.progress} />
                  </p>
                ) : (
                  <span>Download complete</span>
                )
              ) : (
                <span>No download</span>
              )}
              <div className="title">{game.title}</div>
              <div className="buttons">
                {game.installed_at ? (
                  <Button
                    icon="play2"
                    label="Launch"
                    onClick={launch.execute}
                  />
                ) : gameBeingInstalled?.id == game.id ? (
                  <MenuTippy
                    placement="top"
                    content={
                      <InstallModalContents
                        ref={coref("install-modal-contents")}
                        coref={coref}
                        game={gameBeingInstalled}
                      />
                    }
                    interactive
                    visible
                  >
                    {makeButton(game, false)}
                  </MenuTippy>
                ) : (
                  makeButton(game, false)
                )}
                {game.installed_at ? (
                  gameBeingInstalled?.id == game.id ? (
                    <MenuTippy
                      placement="right"
                      content={
                        <InstallModalContents
                          ref={coref("install-modal-contents")}
                          coref={coref}
                          game={gameBeingInstalled}
                        />
                      }
                      interactive
                      visible
                    >
                      {makeButton(game, true)}
                    </MenuTippy>
                  ) : (
                    makeButton(game, true)
                  )
                ) : null}
                <div className="filler" />
                {game.owned ? null : (
                  <IconButton icon="heart-filled" onClick={purchase.execute} />
                )}
              </div>
            </div>
          );
        })}
      </GameGridContainer>
    </>
  );
};
