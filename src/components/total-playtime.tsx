import * as React from "react";
import { connect, I18nProps } from "./connect";

import { formatDuration } from "../format";

import actionForGame from "../util/action-for-game";

import { IGame } from "../db/models/game";
import { ICaveSummary } from "../db/models/cave";

class TotalPlaytime extends React.PureComponent<
  IProps & IDerivedProps & I18nProps
> {
  render() {
    const { t, game, cave, short = false } = this.props;
    const { secondsRun = 0 } = (cave || {}) as ICaveSummary;

    const classification = game.classification || "game";
    const classAction = actionForGame(game, cave);
    const xed =
      classAction === "open"
        ? "opened"
        : classification === "game" ? "played" : "used";

    if (secondsRun > 0 && classAction === "launch") {
      return (
        <div className="total-playtime">
          <span>
            {short
              ? null
              : <label>
                  {t(`usage_stats.has_${xed}_for_duration`)}{" "}
                </label>}
            {formatDuration(secondsRun, t)}
          </span>
        </div>
      );
    }

    return null;
  }
}

interface IProps {
  game: IGame;
  cave: ICaveSummary;
  short?: boolean;
}

interface IDerivedProps {}

export default connect<IProps>(TotalPlaytime);
