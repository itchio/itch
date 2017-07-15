
import * as React from "react";
import {connect} from "./connect";

import format from "../util/format";

import actionForGame from "../util/action-for-game";

import {ILocalizer} from "../localizer";

import {IGameRecord, ICaveRecord} from "../types";

class TotalPlaytime extends React.Component<ITotalPlaytimeProps> {
  render () {
    const {t, game, cave, short = false} = this.props;
    const {secondsRun = 0} = (cave || {});

    const classification = game.classification || "game";
    const classAction = actionForGame(game, cave);
    const xed = classAction === "open" ? "opened" : ((classification === "game") ? "played" : "used");

    if (secondsRun > 0 && classAction === "launch") {
      return <div className="total-playtime">
        <span>
          { short
            ? null
            : <label>{t(`usage_stats.has_${xed}_for_duration`)} </label>
          }
          {t.format(format.seconds(secondsRun))}
        </span>
      </div>;
    }

    return null;

  }
}

interface ITotalPlaytimeProps {
  game: IGameRecord;
  cave: ICaveRecord;
  short?: boolean;

  t: ILocalizer;
}

export default connect()(TotalPlaytime);
