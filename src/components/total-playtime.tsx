
import * as React from "react";
import {connect, I18nProps} from "./connect";

import format from "../util/format";

import actionForGame from "../util/action-for-game";

import {IGameRecord, ICaveRecord} from "../types";

class TotalPlaytime extends React.Component<IProps & IDerivedProps & I18nProps, void> {
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

interface IProps {
  game: IGameRecord;
  cave: ICaveRecord;
  short?: boolean;
}

interface IDerivedProps {}

export default connect<IProps>(TotalPlaytime);
