import * as React from "react";
import * as classNames from "classnames";
import GenericSearchResult, {
  searchResultStyle,
} from "./generic-search-result";

import isPlatformCompatible from "../../util/is-platform-compatible";
import { formatPrice } from "../../format";

import { IGame } from "../../db/models/game";
import { fromJSONField } from "../../db/json-field";

import { ISaleInfo } from "../../types";

import PlatformIcons from "../basics/platform-icons";
import Filler from "../basics/filler";

import styled, * as styles from "../styles";
import * as actions from "../../actions";

const GameSearchResultDiv = styled.div`${searchResultStyle};`;

const Platforms = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const StyledPlatformIcons = styled(PlatformIcons)`
  margin-right: 16px;
`;

const TitleBlock = styled.div`
  padding: 8px 12px;
  flex-grow: 1;

  display: flex;
  flex-direction: column;
  align-items: start;
`;

const Title = styled.div`${styles.singleLine()};`;

const Price = styled.div`
  color: ${props => props.theme.secondaryText};

  &.original {
    text-decoration: line-through;
  }
`;

class GameSearchResult extends GenericSearchResult<ISearchResultProps> {
  render() {
    const { game, onClick, chosen } = this.props;
    const { title, stillCoverUrl, coverUrl } = game;

    let compatible = isPlatformCompatible(game);
    let originalPrice: React.ReactElement<any> = null;
    let price: React.ReactElement<any> = null;

    const sale = fromJSONField<ISaleInfo>(game.sale);

    if (game.minPrice > 0) {
      if (sale) {
        price = (
          <Price>
            {formatPrice("USD", game.minPrice * (1 - sale.rate / 100))}
          </Price>
        );
        originalPrice = (
          <Price className="original">
            {formatPrice("USD", game.minPrice)}
          </Price>
        );
      } else {
        price = (
          <Price>
            {formatPrice("USD", game.minPrice)}
          </Price>
        );
      }
    }

    const resultClasses = classNames({
      ["not-platform-compatible"]: !compatible,
      chosen: chosen,
    });

    return (
      <GameSearchResultDiv
        className={resultClasses}
        onClick={onClick}
        ref="root"
      >
        <img src={stillCoverUrl || coverUrl} />
        <TitleBlock>
          <Title>
            {title}
          </Title>
          <Filler />
          <Platforms>
            <StyledPlatformIcons target={game} />
            <Filler />
            {originalPrice}
            {price}
          </Platforms>
        </TitleBlock>
      </GameSearchResultDiv>
    );
  }

  getNavigateAction() {
    const { game } = this.props;
    return actions.navigateToGame({ game });
  }
}

interface ISearchResultProps {
  game: IGame;
  onClick: () => void;
  chosen: boolean;
  active: boolean;
}

export default GameSearchResult;
