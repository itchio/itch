
import * as React from "react";
import {connect} from "./connect";
import {createStructuredSelector} from "reselect";
import * as classNames from "classnames";

import urls from "../constants/urls";
import * as actions from "../actions";

import Games from "./games";
import GameFilters from "./game-filters";
import {map} from "underscore";

import {IState, IGameRecordSet, IItchAppProfile, IItchAppProfileMyGames} from "../types";
import {IDispatch, dispatcher} from "../constants/action-types";
import {ILocalizer} from "../localizer";

export class Dashboard extends React.Component<IDashboardProps> {
  render () {
    const {t, allGames, myGameIds, navigate} = this.props;

    const games = map(myGameIds, (id) => allGames[id]);

    let sectionCount = 0;
    if (games.length > 0) {
      sectionCount++;
    }

    const showHeaders = (sectionCount > 1);
    const headerClasses = classNames("", {shown: showHeaders});

    const tab = "dashboard";

    return <div className="dashboard-meat">
      <h2 className={headerClasses}>{t("sidebar.dashboard")}</h2>
      <GameFilters tab={tab}>
        <span className="link" onClick={(e) => navigate(`url/${urls.dashboard}`)}>
          {t("outlinks.open_dashboard")}
        </span>
      </GameFilters>
      <Games tab={tab} games={games}/>
    </div>;
  }
}

interface IDashboardProps {
  // derived
  allGames: IGameRecordSet;
  myGameIds: string[];

  t: ILocalizer;

  navigate: typeof actions.navigate;
}

const mapStateToProps = createStructuredSelector({
  allGames: (state: IState) => state.market.games,
  myGameIds: (state: IState) => ((
      (
        state.market.itchAppProfile ||
        {} as IItchAppProfile
      ).myGames ||
      {} as IItchAppProfileMyGames
    ).ids || []),
});

const mapDispatchToProps = (dispatch: IDispatch) => ({
  navigate: dispatcher(dispatch, actions.navigate),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Dashboard);
