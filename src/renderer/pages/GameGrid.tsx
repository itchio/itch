import { messages } from "common/butlerd";
import { Download, Game, GameRecord } from "common/butlerd/messages";
import { formatDurationAsMessage } from "common/format/datetime";
import { fileSize } from "common/format/filesize";
import { packets } from "common/packets";
import { queries } from "common/queries";
import _ from "lodash";
import { DownloadWithProgress } from "main/drive-downloads";
import React, { useEffect, useState } from "react";
import { useAsyncCallback } from "react-async-hook";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { IconButton } from "renderer/basics/IconButton";
import { MenuTippy } from "renderer/basics/Menu";
import { useClickOutside } from "renderer/basics/useClickOutside";
import { useSocket } from "renderer/contexts";
import { InstallModalContents } from "renderer/Shell/InstallModal";
import { useListen } from "renderer/Socket";
import { fontSizes, mixins } from "renderer/theme";
import styled from "styled-components";

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

    .cover-container {
      position: relative;
      width: ${coverWidth * ratio}px;
      height: ${coverHeight * ratio}px;

      & > .download-overlay {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;

        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;

        color: ${p => p.theme.colors.text2};
        font-size: ${fontSizes.small};
      }

      & > .cover {
        width: 100%;
        height: 100%;

        &.missing {
          background-image: linear-gradient(12deg, #121212 0%, #191919 100%);
        }
      }
    }

    & > .title {
      padding: 4px 8px;
      padding-top: 14px;
      font-size: ${fontSizes.small};
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

interface Props {
  records: GameRecord[];
  setRecords: React.Dispatch<React.SetStateAction<GameRecord[]>>;
}

export const GameGrid = function(props: Props) {
  const socket = useSocket();

  const [downloads, setDownloads] = useState<Downloads>({});
  const mergeDownloads = (fresh: Downloads) => {
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

  useListen(socket, packets.gameInstalled, ({ cave }) => {
    updateRecord(props, {
      id: cave.game.id,
      installedAt: new Date().toISOString(),
    });
  });
  useListen(socket, packets.gameUninstalled, ({ gameId }) => {
    (async () => {
      const { items } = await socket.call(messages.FetchCaves, {
        filters: { gameId },
      });

      if (_.isEmpty(items)) {
        updateRecord(props, {
          id: gameId,
          installedAt: undefined,
        });
      }
    })().catch(e => console.warn(e));
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

  return (
    <>
      <GameGridContainer>
        {props.records.map(game => {
          const dl = downloads[game.id];
          return (
            <div className="item" key={game.id} data-game-id={game.id}>
              <a href={`itch://games/${game.id}`}>
                <div className="cover-container">
                  {dl ? (
                    dl.progress ? (
                      <div
                        className="download-overlay"
                        style={{
                          background: `linear-gradient(to right, rgba(0, 0, 0, .7) 0%, rgba(0, 0, 0, .7) ${dl
                            .progress.progress * 100}%, rgba(0, 0, 0, .9) ${dl
                            .progress.progress *
                            100}%, rgba(0, 0, 0, .9) 100%)`,
                        }}
                      >
                        {fileSize(dl.progress.bps)} bps &mdash;{" "}
                        <FormattedMessage
                          {...formatDurationAsMessage(dl.progress.eta)}
                        />{" "}
                      </div>
                    ) : null
                  ) : null}
                  {game.cover ? (
                    <img className="cover" src={game.cover} />
                  ) : (
                    <div className="cover missing" />
                  )}
                </div>
              </a>
              <div className="title">{game.title}</div>
              <div className="buttons">
                {game.installedAt ? (
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
                {game.installedAt ? (
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

const updateRecord = (
  props: Props,
  fresh: Partial<GameRecord> & { id: number }
) => {
  props.setRecords(records => {
    let recIndex = _.findIndex(records, x => x.id === fresh.id);
    if (recIndex !== -1) {
      let newRecords = [...records];
      newRecords[recIndex] = { ...newRecords[recIndex], ...fresh };
      return newRecords;
    } else {
      return records;
    }
  });
};
