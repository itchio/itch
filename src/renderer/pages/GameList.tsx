import classNames from "classnames";
import { messages } from "common/butlerd";
import { Game, GameRecord } from "common/butlerd/messages";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { Button } from "renderer/basics/Button";
import { TimeAgo } from "renderer/basics/TimeAgo";
import { useSocket } from "renderer/contexts";
import { fontSizes, mixins } from "renderer/theme";
import { useAsyncCb } from "renderer/use-async-cb";
import styled from "styled-components";

interface Props {
  records: GameRecord[];
  setRecords: React.Dispatch<React.SetStateAction<GameRecord[]>>;
}

const coverWidth = 300;
const coverHeight = 215;
const ratio = 0.6;

const GameListDiv = styled.div`
  height: 100%;

  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: stretch;

  .list {
    background: rgba(255, 255, 255, 0.05);
    flex-basis: 300px;
    flex-shrink: 0;
    margin-right: 1em;
    overflow-y: scroll;

    padding: 12px 0;

    &:focus {
      outline: none;
    }
  }

  .detail {
    flex-grow: 1;
    max-width: 960px;
    overflow-y: auto;

    display: flex;
    flex-direction: column;
    align-items: stretch;

    padding-top: 25px;
    padding-right: 25px;
    padding-left: 15px;

    h3 {
      font-size: ${fontSizes.enormous};
    }

    .header {
      display: flex;
      flex-direction: row;
      justify-content: space-between;

      .cover {
        flex-shrink: 0;

        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }

      .cover {
        .placeholder,
        img {
          width: ${coverWidth * ratio}px;
          height: ${coverHeight * ratio}px;

          margin-left: 10px;
          margin-bottom: 20px;

          border-radius: 2px;
          border: 1px solid rgba(0, 0, 0, 0.2);
          box-shadow: 0 0 20px 0 #121212;
        }

        .placeholder {
          background: #272727;
        }
      }

      .info p {
        padding-top: 1em;
        line-height: 1.4;

        &.short-text {
          max-width: 500px;
        }

        &.secondary {
          color: ${p => p.theme.colors.text2};
        }
      }
    }
  }

  .row {
    ${mixins.singleLine};
    display: flex;
    align-items: center;
    text-align: left;
    padding: 8px 10px;
    padding-left: 20px;

    &.current {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .list:focus .row.current {
    background: #7b3232;
  }

  .status {
    flex-basis: 100px;
  }

  .installed {
    flex-basis: 100px;
  }

  .title {
    flex-grow: 1;
    color: inherit;
  }

  a {
    text-decoration: none;
  }

  .controls {
    flex-basis: 200px;
  }
`;

const CompactButton = styled(Button)`
  padding: 4px 1em;
  min-width: initial;
  min-height: initial;
`;

const findGameId = (el: HTMLElement): number | undefined => {
  if (typeof el.dataset.gameId !== "undefined") {
    return Number(el.dataset.gameId);
  }

  if (el.parentElement) {
    return findGameId(el.parentElement);
  }
  return undefined;
};

const findIndex = (el: HTMLElement): number | undefined => {
  if (typeof el.dataset.index !== undefined) {
    return Number(el.dataset.index);
  }

  if (el.parentElement) {
    return findIndex(el.parentElement);
  }
  return undefined;
};

export const GameList = (props: Props) => {
  const socket = useSocket();
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem: GameRecord | null = props.records[currentIndex];
  const [currentGame, setCurrentGame] = useState<Game | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (currentIndex >= props.records.length) {
      setCurrentIndex(0);
    }
  }, [props.records.length]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!currentItem) {
        setCurrentGame(null);
        return;
      }

      try {
        {
          const { game } = await socket.call(messages.FetchGame, {
            gameId: currentItem.id,
          });
          if (cancelled) {
            return;
          }
          setCurrentGame(game);
        }

        {
          const { game } = await socket.callWithRefresh(messages.FetchGame, {
            gameId: currentItem.id,
          });
          if (cancelled) {
            return;
          }
          setCurrentGame(game);
        }
      } catch (e) {
        setCurrentGame(null);
      }
    })().catch(e => console.warn(e));
    return () => {
      cancelled = true;
    };
  }, [currentItem]);

  const [install] = useAsyncCb(
    async (game: Game) => {
      console.log("stub");
    },
    [socket]
  );

  const rowClick = useCallback((ev: React.MouseEvent<HTMLElement>) => {
    const index = findIndex(ev.currentTarget);
    if (typeof index === "undefined") {
      return;
    }
    setCurrentIndex(index);
  }, []);

  const focusIndex = useCallback(
    (index: number) => {
      listRef.current
        ?.querySelector(`.row[data-index='${index}']`)
        ?.scrollIntoView({
          behavior: "auto",
          block: "nearest",
          inline: "nearest",
        });
    },
    [listRef.current]
  );

  const listKeyDown = useCallback(
    (ev: React.KeyboardEvent<HTMLElement>) => {
      console.log(`list key down, key = `, ev.key);

      switch (ev.key) {
        case "ArrowDown":
          ev.preventDefault();
          setCurrentIndex(i => {
            let index = (i + 1) % props.records.length;
            focusIndex(index);
            return index;
          });
          break;
        case "ArrowUp":
          ev.preventDefault();
          setCurrentIndex(i => {
            let index = i == 0 ? props.records.length - 1 : i - 1;
            focusIndex(index);
            return index;
          });
          break;
      }
    },
    [props.records.length]
  );

  return (
    <GameListDiv>
      <div className="list" ref={listRef} tabIndex={0} onKeyDown={listKeyDown}>
        {props.records.map((r, index) => {
          return (
            <div
              className={classNames("row", { current: index == currentIndex })}
              key={r.id}
              data-index={index}
              data-game-id={r.id}
              onClick={rowClick}
            >
              <a className="title">{r.title}</a>
            </div>
          );
        })}
      </div>

      <div className="detail">
        {currentItem && currentGame ? (
          <>
            <div className="header">
              <div className="info">
                <h3>{currentGame.title}</h3>
                <p className="short-text">{currentGame.shortText}</p>
                <p className="secondary">
                  {currentItem.installedAt ? (
                    <>
                      Installed <TimeAgo date={currentItem.installedAt} />
                    </>
                  ) : (
                    "Not installed"
                  )}
                </p>
                <p className="secondary">
                  {currentItem.owned ? <>Owned.</> : "Not owned"}
                </p>
              </div>
              <div className="cover">
                <a href={currentGame.url ?? `itch://games/${currentGame.id}`}>
                  {currentGame.stillCoverUrl ?? currentGame.coverUrl ? (
                    <img
                      src={currentGame.stillCoverUrl ?? currentGame.coverUrl}
                    />
                  ) : (
                    <div className="placeholder" />
                  )}
                </a>
                <Button
                  icon="install"
                  label="Install"
                  onClick={() => install(currentGame)}
                  secondary
                />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </GameListDiv>
  );
};
