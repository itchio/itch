import { Game, GameRecord } from "common/butlerd/messages";
import React, { useState } from "react";
import { Button } from "renderer/basics/Button";
import { IconButton } from "renderer/basics/IconButton";
import { mixins } from "renderer/theme";
import styled from "styled-components";
import { useAsyncCallback } from "react-async-hook";
import { useSocket } from "renderer/contexts";
import { messages } from "common/butlerd";
import { queries } from "common/queries";
import { InstallModal } from "renderer/Shell/InstallModal";
import Tippy from "@tippy.js/react";
import { CONNREFUSED } from "dns";
import { useOutsideClickListener } from "react-click-outside-listener";

let coverBorder = 1;
let coverWidth = 300;
let coverHeight = 215;
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

  .item {
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

    .title {
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

    .title,
    .buttons {
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

export const GameGrid = function(props: { records: GameRecord[] }) {
  const socket = useSocket();
  const [gameIdLoading, setGameIdLoading] = useState<
    number | undefined
  >();
  const [gameBeingInstalled, setGameBeingInstalled] = useState<
    Game | undefined
  >();
  const coref = useOutsideClickListener(() => {
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

  const { records } = props;
  return (
    <>
      {/* {gameBeingInstalled && (
        <InstallModal
          game={gameBeingInstalled}
          onClose={() => setGameBeingInstalled(undefined)}
        />
      )} */}

      <GameGridContainer>
        {records.map(game => (
          <div className="item" key={game.id} data-game-id={game.id}>
            <a href={`itch://games/${game.id}`}>
              {game.cover ? (
                <img className="cover" src={game.cover} />
              ) : (
                <div className="cover missing" />
              )}
            </a>
            <div className="title">{game.title}</div>
            <div className="buttons">
              {game.installed_at ? (
                <Button icon="play2" label="Launch" onClick={launch.execute} />
              ) : (
                <Tippy placement="top-start" content={<div ref={coref(0)}><p>I'm being installed!</p><p>No, for real!</p><br/><p>Some of those upload names are pretty long, too</p></div>} interactive visible={gameBeingInstalled?.id == game.id}>
                <Button
                ref={coref(1)}
                  icon="install"
                  label="Install"
                  loading={game.id == gameIdLoading}
                  onClick={install.execute}
                  secondary={game.id == gameBeingInstalled?.id}
                />
                </Tippy>
              )}
              <div className="filler" />
              {game.owned ? null : (
                <IconButton icon="heart-filled" onClick={purchase.execute} />
              )}
            </div>
          </div>
        ))}
      </GameGridContainer>
    </>
  );
};
