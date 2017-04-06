
import * as React from "react";
import GenericSearchResult from "./generic-search-result";

import platformData from "../../constants/platform-data";

import isPlatformCompatible from "../../util/is-platform-compatible";
import format from "../../util/format";

import {IGameRecord} from "../../types";

import Icon from "../icon";

class GameSearchResult extends GenericSearchResult<ISearchResultProps, void> {
  render () {
    const {game, onClick, chosen} = this.props;
    const {title, stillCoverUrl, coverUrl} = game;

    const platforms: React.ReactElement<any>[] = [];
    let compatible = isPlatformCompatible(game);

    if (game.type === "html") {
      platforms.push(<Icon hint="web" icon="earth"/>);
    }

    for (const p of platformData) {
      if ((game as any)[p.field]) {
        platforms.push(<Icon hint={p.platform} icon={p.icon}/>);
      }
    }

    let price: React.ReactElement<any> = null;
    if (game.minPrice > 0) {
      price = <span className="price">{format.price("USD", game.minPrice)}</span>;
    }

    const resultClasses = classNames("search-result", {
      ["not-platform-compatible"]: !compatible,
      chosen: chosen,
    });

    return <div className={resultClasses} onClick={onClick} ref="root">
      <img src={stillCoverUrl || coverUrl}/>
      <div className="title-block">
        <h4>{title}</h4>
        <span className="platforms">
          {platforms}
          {price}
        </span>
      </div>
    </div>;
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
