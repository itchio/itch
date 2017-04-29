
import * as React from "react";
import * as classNames from "classnames";
import GenericSearchResult, {searchResultStyle} from "./generic-search-result";

import platformData from "../../constants/platform-data";

import isPlatformCompatible from "../../util/is-platform-compatible";
import format from "../../util/format";

import {IGameRecord} from "../../types";

import Icon from "../basics/icon";
import Filler from "../basics/filler";

import styled, * as styles from "../styles";

const GameSearchResultDiv = styled.div`
  ${searchResultStyle}
`;

const Platforms = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  .icon {
    margin-right: 8px;
  }
`;

const TitleBlock = styled.div`
  padding: 8px 12px;
  flex-grow: 1;

  display: flex;
  flex-direction: column;
  align-items: start;
`;

const Title = styled.div`
  ${styles.singleLine()}
`;

const Price = styled.div`
  color: ${props => props.theme.secondaryText};

  &.original {
    text-decoration: line-through;
  }
`;

class GameSearchResult extends GenericSearchResult<ISearchResultProps, void> {
  render () {
    const {game, onClick, chosen} = this.props;
    const {title, stillCoverUrl, coverUrl} = game;

    const platforms: React.ReactElement<any>[] = [];
    let compatible = isPlatformCompatible(game);

    if (game.type === "html") {
      platforms.push(<Icon key="web" hint="web" icon="earth"/>);
    }

    for (const p of platformData) {
      if ((game as any)[p.field]) {
        platforms.push(<Icon key={p.platform} hint={p.platform} icon={p.icon}/>);
      }
    }

    let originalPrice: React.ReactElement<any> = null;
    let price: React.ReactElement<any> = null;

    if (game.minPrice > 0) {
      if (game.sale) {
        price = <Price>{format.price("USD", game.minPrice * (1 - game.sale.rate / 100))}</Price>;
        originalPrice = <Price className="original">{format.price("USD", game.minPrice)}</Price>;
      } else {
        price = <span className="price">{format.price("USD", game.minPrice)}</span>;
      }
    }

    const resultClasses = classNames({
      ["not-platform-compatible"]: !compatible,
      chosen: chosen,
    });

    return <GameSearchResultDiv className={resultClasses} onClick={onClick} ref="root">
      <img src={stillCoverUrl || coverUrl}/>
      <TitleBlock>
        <Title>{title}</Title>
        <Filler/>
        <Platforms>
          {platforms}
          <Filler/>
          {originalPrice}
          {price}
        </Platforms>
      </TitleBlock>
    </GameSearchResultDiv>;
  }

  getPath(): string {
    return `games/${this.props.game.id}`;
  }
}

interface ISearchResultProps {
  game: IGameRecord;
  onClick: () => void;
  chosen: boolean;
  active: boolean;
}

export default GameSearchResult;
