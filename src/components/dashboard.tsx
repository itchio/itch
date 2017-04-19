
import * as React from "react";
import {connect, I18nProps} from "./connect";
import {createStructuredSelector} from "reselect";
import * as classNames from "classnames";

import urls from "../constants/urls";
import * as actions from "../actions";

import Games from "./games";
import GameFilters from "./game-filters";
import {map} from "underscore";

import {IAppState, IGameRecordSet, IItchAppProfile, IItchAppProfileMyGames} from "../types";
import {dispatcher} from "../constants/action-types";

export class Dashboard extends React.Component<IProps & IDerivedProps & I18nProps, void> {
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

interface IProps {}

interface IDerivedProps {
  allGames: IGameRecordSet;
  myGameIds: string[];

  navigate: typeof actions.navigate;
}

export default connect<IProps>(Dashboard, {
  state: createStructuredSelector({
    allGames: (state: IAppState) => state.market.games,
    myGameIds: (state: IAppState) => ((
      (
        state.market.itchAppProfile ||
        {} as IItchAppProfile
      ).myGames ||
      {} as IItchAppProfileMyGames
    ).ids || []),
  }),
  dispatch: (dispatch) => ({
    navigate: dispatcher(dispatch, actions.navigate),
  }),
});
