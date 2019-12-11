import { Game } from "common/butlerd/messages";
import React from "react";
import { Button } from "renderer/basics/Button";
import { IconButton } from "renderer/basics/IconButton";
import { mixins } from "renderer/theme";
import styled from "styled-components";

let ratio = 0.9;

const GameGridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, ${300 * ratio}px);
  grid-row-gap: 2em;
  grid-column-gap: 1em;
  justify-content: space-evenly;

  /* display: flex;
  flex-wrap: wrap; */

  .item {
    background: #202020;
    border: 1px solid #333;
    border-radius: 4px;

    .cover {
      width: ${300 * ratio}px;
      height: ${215 * ratio}px;
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

export const GameGrid = function<T>(props: {
  items: T[];
  getGame: (t: T) => Game;
}) {
  const { items, getGame } = props;
  return (
    <>
      <GameGridContainer>
        {items.map(getGame).map(game => (
          <div className="item" key={game.id}>
            <a href={`itch://games/${game.id}`}>
              <img
                className="cover"
                src={game.stillCoverUrl || game.coverUrl}
              />
            </a>
            <div className="title">{game.title}</div>
            <div className="buttons">
              <Button icon="install" label="Install" />
              <div className="filler" />
              <IconButton
                icon="heart-filled"
                onClick={() => (location.href = `${game.url}/purchase`)}
              />
              <IconButton
                icon="share"
                onClick={() => (location.href = `${game.url}/purchase`)}
              />
            </div>
          </div>
        ))}
      </GameGridContainer>
    </>
  );
};
