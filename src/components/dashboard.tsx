
import * as React from "react";
import {connect, I18nProps} from "./connect";
import {createStructuredSelector} from "reselect";

import urls from "../constants/urls";
import * as actions from "../actions";

import Link from "./basics/link";
import Games from "./games";
import GameFilters from "./game-filters";
import {map} from "underscore";

import {IAppState, IGameRecordSet, IItchAppProfile, IItchAppProfileMyGames} from "../types";
import {dispatcher} from "../constants/action-types";

import styled, * as styles from "./styles";

const DashboardContainer = styled.div`
  ${styles.meat()}
`;

export class Dashboard extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, allGames, myGameIds, navigate} = this.props;

    const games = map(myGameIds, (id) => allGames[id]);

    const tab = "dashboard";

    return <DashboardContainer>
      <GameFilters tab={tab}>
        <Link
          label={t("outlinks.open_dashboard")}
          onClick={(e) => navigate(`url/${urls.dashboard}`)}
        />
      </GameFilters>
      <Games tab={tab} games={games}/>
    </DashboardContainer>;
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
