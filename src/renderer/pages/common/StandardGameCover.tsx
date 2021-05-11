import React from "react";
import classNames from "classnames";
import { Game } from "common/butlerd/messages";
import styled, * as styles from "renderer/styles";
import { GameCover } from "renderer/basics/Cover";
import StandardSaleRibbon from "renderer/pages/common/StandardSaleRibbon";
import { truncate } from "common/format/truncate";
import { Desc } from "renderer/pages/PageStyles/games";
import Filler from "renderer/basics/Filler";
import PlatformIcons from "renderer/basics/PlatformIcons";
import { urlForGame, ambientWind } from "common/util/navigation";
import { hook } from "renderer/hocs/hook";
import { Dispatch } from "common/types";
import { actions } from "common/actions";

//-----------------------------------
// Cover
//-----------------------------------

const baseWidth = 215;
const baseHeight = 170;

const coverFactor = 0.9;
export const standardCoverWidth = baseWidth * coverFactor;
export const standardCoverHeight = baseHeight * coverFactor;

const CoverBox = styled.div`
  flex-shrink: 0;
  width: ${standardCoverWidth}px;
  height: ${standardCoverHeight}px;
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

  pointer-events: none;

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
  ${styles.singleLine};
  flex-shrink: 0;
  font-size: ${(props) => props.theme.fontSizes.huge};
  font-weight: bold;
  padding: 0.3em 0;
`;

class StandardGameCover extends React.PureComponent<Props> {
  render() {
    const {
      game,
      showInfo,
      className,
      children,
      showGifMarker = true,
      ...restProps
    } = this.props;

    return (
      <CoverBox
        {...restProps}
        className={classNames(className, { showInfo })}
        onContextMenu={this.onContextMenu}
      >
        {game ? (
          <>
            <a href={urlForGame(game.id)}>
              <GameCover
                game={game}
                showGifMarker={!showInfo && showGifMarker}
              />
              <StandardSaleRibbon game={game} />
              {showInfo ? (
                <>
                  <CoverInfo className="cover-hover">
                    <DarkBox>
                      <DarkTitle>{game.title}</DarkTitle>
                      <Desc>{truncate(game.shortText, { length: 70 })}</Desc>
                      <Filler />
                      <PlatformIcons target={game} />
                    </DarkBox>
                  </CoverInfo>
                </>
              ) : null}
            </a>
          </>
        ) : null}
        {children}
      </CoverBox>
    );
  }

  onContextMenu = (ev) => {
    const { game, dispatch } = this.props;
    if (!game) {
      return;
    }
    const { clientX, clientY } = ev;
    ev.preventDefault();
    const wind = ambientWind();
    dispatch(
      actions.openGameContextMenu({
        clientX,
        clientY,
        game,
        wind,
      })
    );
  };
}

interface Props {
  dispatch: Dispatch;
  game: Game;
  showInfo?: boolean;
  className?: string;
  showGifMarker?: boolean;
  children?: JSX.Element | JSX.Element[];
}

export default hook()(StandardGameCover);
