import { Game } from "common/butlerd/messages";
import React from "react";
import { Button } from "renderer/basics/Button";
import { IconButton } from "renderer/basics/IconButton";
import { mixins } from "renderer/theme";
import styled from "styled-components";

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
              {game.stillCoverUrl || game.coverUrl ? (
                <img
                  className="cover"
                  src={game.stillCoverUrl || game.coverUrl}
                />
              ) : (
                <div className="cover missing" />
              )}
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
