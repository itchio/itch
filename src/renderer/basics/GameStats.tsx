import { Game } from "common/butlerd/messages";
import { hasPlatforms } from "common/constants/platform-data";
import { formatPrice } from "common/format/price";
import { GameStatus } from "common/helpers/get-game-status";
import { actionForGame } from "common/util/action-for-game";
import React from "react";
import LastPlayed from "renderer/basics/LastPlayed";
import PlatformIcons from "renderer/basics/PlatformIcons";
import TimeAgo from "renderer/basics/TimeAgo";
import TotalPlaytime from "renderer/basics/TotalPlaytime";
import styled from "renderer/styles";
import { T } from "renderer/t";

const GameStatsDiv = styled.div`
  display: flex;
  flex-direction: column;
  font-size: ${(props) => props.theme.fontSizes.baseText};
  color: ${(props) => props.theme.secondaryText};
  line-height: 1.8;
  justify-content: flex-end;

  div {
    margin-right: 12px;
  }

  label {
    color: #fff;

    .nice-ago {
      color: ${(props) => props.theme.secondaryText}; // sigh
    }

    &.original-price {
      text-decoration: line-through;
      color: inherit;
    }
  }

  .total-playtime--line {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .total-playtime,
  .last-playthrough {
    font-size: ${(props) => props.theme.fontSizes.baseText};
    margin-right: 5px;
  }
`;

const GameTitle = styled.div`
  font-weight: 700;
  line-height: 120%;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: normal;
`;

const SpacedPlatformIcons = styled(PlatformIcons)`
  margin-left: 4px;
`;

class GameStats extends React.PureComponent<Props> {
  render() {
    const { game, status } = this.props;
    const classification = game.classification || "game";

    const { cave, downloadKey } = status;
    const classAction = actionForGame(game, cave);

    if (cave) {
      return (
        <GameStatsDiv>
          <GameTitle>{game.title}</GameTitle>
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
            <GameTitle>{game.title}</GameTitle>
            <div className="total-playtime--line game-summary">
              {T([`usage_stats.description.${classification}`])}
              {showPlatforms ? (
                <span>
                  {" "}
                  {T([
                    "usage_stats.description.platforms",
                    {
                      platforms: (
                        <SpacedPlatformIcons
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

interface Props {
  game: Game;
  status: GameStatus;
}
