import * as React from "react";
import * as classNames from "classnames";
import GenericSearchResult from "./generic-search-result";

import isPlatformCompatible from "../../util/is-platform-compatible";
import { formatPrice, applySale } from "../../format";

import { fromJSONField } from "../../db/json-field";

import Hoverable from "../basics/hover-hoc";
import Filler from "../basics/filler";
import Cover from "../basics/cover";
const HoverCover = Hoverable(Cover);

import styled, * as styles from "../styles";
import { actions } from "../../actions";
import PlatformIcons from "../basics/platform-icons";
import { connect, Dispatchers, actionCreatorsList } from "../connect";
import { Game } from "node-buse/lib/messages";

const StyledPlatformIcons = styled(PlatformIcons)`
  -webkit-filter: brightness(90%);

  .icon {
    text-shadow: 1px 1px 1px #000000;
  }
`;

const GameSearchResultDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 10px 20px;
  margin: 6px 0;
  box-shadow: 0 0 8px rgba(40, 40, 40, 0.3);
  flex-shrink: 0;

  border-left: 2px solid transparent;
  background-color: ${props => props.theme.sidebarEntryFocusedBackground};

  margin-right: 10px;
  border-radius: 0 4px 4px 0;

  &.chosen {
    border-color: ${props => props.theme.accent};
    cursor: pointer;
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
  }

  .vertical-section {
    display: flex;
    flex-direction: row;
    flex-shrink: 0;

    &.title {
      align-items: center;
    }

    &.rest {
      margin: 6px 0;
    }
  }

  .cover-container {
    flex-shrink: 0;
    width: ${80 * 1.0}px;

    display: flex;
    flex-direction: row;
    align-items: flex-start;

    .cover {
      width: 100%;
    }
  }
`;

const TitleBlock = styled.div`
  padding: 0 12px;
  flex-grow: 1;

  display: flex;
  flex-direction: column;
  align-items: start;
`;

const ShortText = styled.div`
  margin-bottom: 6px;
  line-height: 1.6;
  color: ${props => props.theme.secondaryText};
`;

const Title = styled.div`
  ${styles.singleLine()};

  font-size: ${props => props.theme.fontSizes.large};
  line-height: 1.4;
  sadding-bottom: 0.4em;
`;

const Price = styled.div`
  margin-left: 10px;

  text-transform: uppercase;

  padding: 3px 4px 2px 3px;
  border-radius: 2px;

  font-size: ${props => props.theme.fontSizes.smaller};

  ${props => styles.metaColors(props.theme.priceNormal)};

  &.onsale {
    ${props => styles.metaColors(props.theme.priceSale)};
  }
`;

class GameSearchResult extends GenericSearchResult<IProps & IDerivedProps> {
  render() {
    const { game, onClick, chosen } = this.props;
    const { title, stillCoverUrl, coverUrl } = game;

    let compatible = isPlatformCompatible(game);
    let price: React.ReactElement<any> = null;

    const sale = fromJSONField(game.sale);

    if (game.minPrice > 0) {
      let bestPrice = applySale(game.minPrice, sale);
      // bundles will have a 0% rate for example
      const onsale = !!(sale && sale.rate !== 0);

      // FIXME: hardcoding 'USD' is wrong
      price = (
        <Price className={classNames({ onsale })}>
          {formatPrice("USD", bestPrice)}
        </Price>
      );
    }

    const resultClasses = classNames("game-search-result", {
      ["not-platform-compatible"]: !compatible,
      chosen: chosen,
    });

    return (
      <GameSearchResultDiv
        className={resultClasses}
        onClick={onClick}
        onContextMenu={this.onContextMenu}
        data-game-id={game.id}
        ref="root"
      >
        <div className="vertical-section title">
          <Title>{title}</Title>
          <Filler />
          <StyledPlatformIcons target={game} />
          {price}
        </div>
        <div className="vertical-section rest">
          <div className="cover-container">
            <HoverCover
              className="cover"
              gameId={game.id}
              coverUrl={coverUrl}
              stillCoverUrl={stillCoverUrl}
              showGifMarker
            />
          </div>
          <TitleBlock>
            <ShortText>{game.shortText}</ShortText>
          </TitleBlock>
        </div>
      </GameSearchResultDiv>
    );
  }

  getNavigateAction() {
    const { game } = this.props;
    return actions.navigateToGame({ game });
  }

  onContextMenu = (ev: React.MouseEvent<any>) => {
    const { game } = this.props;
    this.props.openGameContextMenu({
      game,
      clientX: ev.clientX,
      clientY: ev.clientY,
    });
  };
}

interface IProps {
  game: Game;
  onClick: () => void;
  chosen: boolean;
  active: boolean;
  index: number;
}

const actionCreators = actionCreatorsList(
  "searchHighlightOffset",
  "openGameContextMenu"
);

type IDerivedProps = Dispatchers<typeof actionCreators>;

export default connect<IProps>(GameSearchResult, { actionCreators });
