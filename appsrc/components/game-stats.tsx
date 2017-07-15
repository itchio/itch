
import * as React from "react";
import {connect} from "./connect";
import {createSelector} from "reselect";
import {findWhere} from "underscore";

import interleave from "./interleave";

import platformData from "../constants/platform-data";
import actionForGame from "../util/action-for-game";

import format from "../util/format";

import NiceAgo from "./nice-ago";
import Icon from "./icon";
import TotalPlaytime from "./total-playtime";
import LastPlayed from "./last-played";

import {ILocalizer} from "../localizer";

import {
  IState, IUserMarketState,
  IGameRecord, ICaveRecord, IDownloadKey,
} from "../types";

export class GameStats extends React.Component<IGameStatsProps> {
  render () {
    const {t, cave, game = {} as IGameRecord, downloadKey, mdash = true} = this.props;
    const classification = game.classification || "game";
    const classAction = actionForGame(game, cave);

    if (cave) {
      return <div className="game-stats">
        <TotalPlaytime game={game} cave={cave}/>
        <LastPlayed game={game} cave={cave}/>
      </div>;
    } else {
      const platforms: JSX.Element[] = [];
      if (classAction === "launch") {
        for (const p of platformData) {
          if ((game as any)[p.field]) {
            platforms.push(<Icon title={p.platform} icon={p.icon}/>);
          }
        }
      }
      const {minPrice, currency = "USD"} = game;

      return <div className="game-stats">
        <div className="total-playtime">
        {t(`usage_stats.description.${classification}`)}
        {(platforms.length > 0)
          ? [" ", interleave(t, "usage_stats.description.platforms", {platforms})]
          : ""
        }
        {mdash ? " — " : <br/>}
        {downloadKey
          ? interleave(t, "usage_stats.description.bought_time_ago",
              {time_ago: <NiceAgo date={downloadKey.createdAt}/>})
          : (minPrice > 0
            ? interleave(t, "usage_stats.description.price", {
              price: <label>
                {format.price(currency, minPrice)}
              </label>,
            })
            : t("usage_stats.description.free_download")
          )
        }
        </div>
      </div>;
    }
  }
}

interface IGameStatsProps {
  game: IGameRecord;
  cave: ICaveRecord;
  downloadKey: IDownloadKey;
  mdash: boolean;

  t: ILocalizer;
}

const mapStateToProps = () => {
  return createSelector(
    (state: IState, props: IGameStatsProps) => state.market,
    (state: IState, props: IGameStatsProps) => state.globalMarket,
    (state: IState, props: IGameStatsProps) => props.game,
    (userMarket, globalMarket, game) => ({
      downloadKey: findWhere((userMarket || {} as IUserMarketState).downloadKeys || {}, {gameId: game.id}),
      cave: globalMarket.cavesByGameId[game.id],
    }),
  );
};

const mapDispatchToProps = () => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GameStats);
