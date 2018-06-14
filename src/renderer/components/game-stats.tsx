import React from "react";

import { T } from "renderer/t";

import { hasPlatforms } from "common/constants/platform-data";

import TimeAgo from "./basics/time-ago";
import PlatformIcons from "./basics/platform-icons";
import TotalPlaytime from "./total-playtime";
import LastPlayed from "./last-played";

import styled from "./styles";
import { IGameStatus } from "common/helpers/get-game-status";
import { Game } from "common/butlerd/messages";
import { formatPrice } from "common/format/price";
import { actionForGame } from "common/util/action-for-game";

const GameStatsDiv = styled.div`
  display: flex;
  flex-direction: column;
  font-size: ${props => props.theme.fontSizes.baseText};
  color: ${props => props.theme.secondaryText};
  line-height: 1.8;
  flex-shrink: 0;
  justify-content: flex-end;

  div {
    margin-right: 12px;
  }

  label {
    color: #fff;

    .nice-ago {
      color: ${props => props.theme.secondaryText}; // sigh
    }

    &.original-price {
      text-decoration: line-through;
      color: inherit;
    }
  }

  .total-playtime {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .total-playtime--platforms {
    margin-left: 4px;
  }

  .total-playtime .icon {
    margin: 0 3px;
  }

  .total-playtime,
  .last-playthrough {
    font-size: ${props => props.theme.fontSizes.baseText};
    margin-right: 5px;
  }
`;

class GameStats extends React.PureComponent<IProps> {
  render() {
    const { game, status } = this.props;
    const classification = game.classification || "game";

    const { cave, downloadKey } = status;
    const classAction = actionForGame(game, cave);

    if (cave) {
      return (
        <GameStatsDiv>
          <TotalPlaytime game={game} cave={cave} />
          <LastPlayed game={game} cave={cave} />
        </GameStatsDiv>
      );
    } else {
      const { minPrice } = game;
      const currency = "USD";
      const { sale } = game;
      const showPlatforms = classAction === "launch" && hasPlatforms(game);

      // TODO: break down into components, or functions at the very least
      return (
        <GameStatsDiv>
          <div className="total-playtime">
            <div className="total-playtime--line game-summary">
              {game.title}
              {" — "}
              {T([`usage_stats.description.${classification}`])}
              {showPlatforms ? (
                <span>
                  {" "}
                  {T([
                    "usage_stats.description.platforms",
                    {
                      platforms: (
                        <PlatformIcons
                          className="total-playtime--platforms"
                          target={game}
                        />
                      ),
                    },
                  ])}
                </span>
              ) : null}
            </div>
            <div className="total-playtime--line">
              {downloadKey
                ? T([
                    "usage_stats.description.bought_time_ago",
                    {
                      time_ago: <TimeAgo date={downloadKey.createdAt} />,
                    },
                  ])
                : minPrice > 0
                  ? T([
                      "usage_stats.description.price",
                      {
                        price: sale ? (
                          <span>
                            <label
                              key="original-price"
                              className="original-price"
                            >
                              {formatPrice(currency, minPrice)}
                            </label>
                            <label key="discounted-price">
                              {" "}
                              {formatPrice(
                                currency,
                                minPrice * (1 - sale.rate / 100)
                              )}
                            </label>
                          </span>
                        ) : (
                          <label>{formatPrice(currency, minPrice)}</label>
                        ),
                      },
                    ])
                  : T(["usage_stats.description.free_download"])}
            </div>
          </div>
        </GameStatsDiv>
      );
    }
  }
}

export default GameStats;

interface IProps {
  game: Game;
  status: IGameStatus;
}
