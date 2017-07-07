import * as React from "react";

import interleave from "./interleave";

import format from "./format";

import platformData from "../constants/platform-data";
import actionForGame from "../util/action-for-game";

import { formatPrice } from "../format";

import TimeAgo from "./basics/time-ago";
import Icon from "./basics/icon";
import TotalPlaytime from "./total-playtime";
import LastPlayed from "./last-played";

import { IGame } from "../db/models/game";
import { ICaveSummary } from "../db/models/cave";
import { IDownloadKeySummary } from "../db/models/download-key";
import { fromJSONField } from "../db/json-field";
import { ISaleInfo } from "../types";

import styled from "./styles";
import { injectIntl, InjectedIntl } from "react-intl";

const GameStatsDiv = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 14px;
  color: ${props => props.theme.secondaryText};
  padding: 16px 0;
  line-height: 1.8;
  flex-shrink: 0;

  div {
    margin-right: 12px;
  }

  label {
    color: #b3b2b7; // FIXME: exceptions bad

    .nice-ago {
      color: ${props => props.theme.secondaryText}; // sigh
    }

    &.original-price {
      text-decoration: line-through;
      color: inherit;
    }
  }

  .total-playtime .icon {
    margin: 0 3px;
  }

  .total-playtime,
  .last-playthrough {
    font-size: 14px;
    margin-right: 5px;
  }
`;

export class GameStats extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const {
      cave,
      game = {} as IGame,
      downloadKey,
      mdash = true,
      intl,
    } = this.props;
    const classification = game.classification || "game";
    const classAction = actionForGame(game, cave);

    if (cave) {
      return (
        <GameStatsDiv>
          <TotalPlaytime game={game} cave={cave} />
          <LastPlayed game={game} cave={cave} />
        </GameStatsDiv>
      );
    } else {
      const platforms: JSX.Element[] = [];
      if (classAction === "launch") {
        for (const p of platformData) {
          if ((game as any)[p.field]) {
            platforms.push(
              <Icon key={p.icon} hint={p.platform} icon={p.icon} />,
            );
          }
        }
      }
      const { minPrice, currency = "USD" } = game;
      const sale = fromJSONField<ISaleInfo>(game.sale);

      return (
        <GameStatsDiv>
          <div className="total-playtime">
            {format([`usage_stats.description.${classification}`])}
            {platforms.length > 0
              ? [
                  " ",
                  interleave(intl, "usage_stats.description.platforms", {
                    platforms,
                  }),
                ]
              : ""}
            {mdash ? " — " : <br />}
            {downloadKey
              ? interleave(intl, "usage_stats.description.bought_time_ago", {
                  time_ago: <TimeAgo date={downloadKey.createdAt} />,
                })
              : minPrice > 0
                ? interleave(intl, "usage_stats.description.price", {
                    price: sale
                      ? [
                          <label
                            key="original-price"
                            className="original-price"
                          >
                            {formatPrice(currency, minPrice)}
                          </label>,
                          <label key="discounted-price">
                            {" "}{formatPrice(
                              currency,
                              minPrice * (1 - sale.rate / 100),
                            )}
                          </label>,
                        ]
                      : <label>
                          {formatPrice(currency, minPrice)}
                        </label>,
                  })
                : format(["usage_stats.description.free_download"])}
          </div>
        </GameStatsDiv>
      );
    }
  }
}

interface IProps {
  game: IGame;
  downloadKey: IDownloadKeySummary;
  cave: ICaveSummary;
  mdash?: boolean;
}

interface IDerivedProps {
  intl: InjectedIntl;
}

export default injectIntl(GameStats);
