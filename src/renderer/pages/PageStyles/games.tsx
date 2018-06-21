import React from "react";
import classNames from "classnames";
import styled from "renderer/styles";
import { urlForGame } from "common/util/navigation";
import { GameCover } from "renderer/basics/Cover";
import { Game } from "common/butlerd/messages";

//-----------------------------------
// Cover
//-----------------------------------

const baseWidth = 215;
const baseHeight = 170;

export const coverWidth = baseWidth * 0.8;
export const coverHeight = baseHeight * 0.8;

export const bigFactor = 1.8;
export const bigCoverWidth = coverWidth * bigFactor;
export const bigCoverHeight = coverHeight * bigFactor;

const CoverBox = styled.div`
  flex-shrink: 0;
  width: ${coverWidth}px;
  height: ${coverHeight}px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
  position: relative;

  .cover-hover {
    opacity: 0;
    transition: all 0.4s;
  }

  &.grower {
    transition: all 0.4s;

    &:hover {
      .cover-hover {
        opacity: 1;
      }
      width: ${bigCoverWidth}px;
      height: ${bigCoverHeight}px;
    }
  }
`;

const CoverInfo = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  padding: 1em;

  h2 {
    font-size: 24px;
    font-weight: light;
  }

  p {
    color: ${props => props.theme.secondaryText};
  }
`;

export const StandardGameCover = ({
  game,
  grower,
  ...restProps
}: {
  game: Game;
  grower?: boolean;
}) => (
  <CoverBox {...restProps} className={classNames({ grower })}>
    {game ? (
      <>
        <a href={urlForGame(game.id)}>
          <GameCover game={game} />
          {grower ? (
            <CoverInfo className="cover-hover">
              <h2>{game.title}</h2>
              <p>{game.shortText}</p>
            </CoverInfo>
          ) : null}
        </a>
      </>
    ) : null}
  </CoverBox>
);

//-----------------------------------
// Description
//-----------------------------------

export const TitleBox = styled.div`
  padding: 8px 0;
  align-self: flex-start;
`;

export const Title = styled.div`
  font-size: ${props => props.theme.fontSizes.huger};
  font-weight: bold;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

export const TitleSpacer = styled.div`
  width: 8px;
`;

export const Desc = styled.div`
  color: ${props => props.theme.secondaryText};
`;
