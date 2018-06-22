import classNames from "classnames";
import React from "react";
import styled, * as styles from "renderer/styles";
import { urlForGame } from "common/util/navigation";
import { GameCover } from "renderer/basics/Cover";
import { Game } from "common/butlerd/messages";
import Filler from "renderer/basics/Filler";
import PlatformIcons from "renderer/basics/PlatformIcons";
import StandardSaleRibbon from "renderer/pages/common/StandardSaleRibbon";

//-----------------------------------
// Cover
//-----------------------------------

const baseWidth = 215;
const baseHeight = 170;

const coverFactor = 1.1;
export const coverWidth = baseWidth * coverFactor;
export const coverHeight = baseHeight * coverFactor;

const CoverBox = styled.div`
  flex-shrink: 0;
  width: ${coverWidth}px;
  height: ${coverHeight}px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
  position: relative;

  &.showInfo {
    .cover-hover {
      opacity: 0;
      transition: opacity 0.4s;
    }

    img {
      transition: filter 0.4s;
    }

    &:hover {
      img {
        filter: brightness(42%) saturate(42%);
      }

      .cover-hover {
        opacity: 1;
      }
    }
  }
`;

const CoverInfo = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;

  display: flex;
  flex-direction: row;
  align-items: center;

  line-height: 1.4;
`;

const DarkBox = styled.div`
  margin: 0;
  padding: 0;
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  align-self: stretch;
  width: 100%;
  padding: 0.3em 0.7em;
  background: rgba(0, 0, 0, 0.5);
`;

const DarkTitle = styled.div`
  ${styles.singleLine()};
  font-size: ${props => props.theme.fontSizes.huge};
  font-weight: 200;
  padding: 0.3em 0;
`;

export const StandardGameCover = ({
  game,
  showInfo,
  ...restProps
}: {
  game: Game;
  showInfo?: boolean;
}) => (
  <CoverBox {...restProps} className={classNames({ showInfo })}>
    {game ? (
      <>
        <a href={urlForGame(game.id)}>
          <GameCover game={game} showGifMarker={!showInfo} />
          <StandardSaleRibbon game={game} />
          {showInfo ? (
            <>
              <CoverInfo className="cover-hover">
                <DarkBox>
                  <DarkTitle>{game.title}</DarkTitle>
                  <p>
                    <Desc>{game.shortText}</Desc>
                  </p>
                  <Filler />
                  <PlatformIcons target={game} />
                </DarkBox>
              </CoverInfo>
            </>
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
  padding: 12px 0;
  align-self: flex-start;

  display: flex;
  flex-direction: column;
  align-self: stretch;
`;

export const Title = styled.div`
  font-size: ${props => props.theme.fontSizes.huger};
  font-weight: 200;
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
