
import * as React from "react";
import {connect, I18nProps} from "./connect";
import {createStructuredSelector} from "reselect";

import urls from "../constants/urls";
import * as actions from "../actions";

import Link from "./basics/link";
import Games from "./games";
import GameFilters from "./game-filters";
import {map} from "underscore";

import {dispatcher} from "../constants/action-types";

import {getUserMarket} from "./market";
import GameModel from "../models/game";

import styled, * as styles from "./styles";

const DashboardContainer = styled.div`
  ${styles.meat()}
`;

export class Dashboard extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, games, navigate} = this.props;

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
  // TODO types
  games: Array<any>;
  meId: number;
  navigate: typeof actions.navigate;
}

class DashboardFetcher extends React.Component<IProps & IDerivedProps & I18nProps, IState> {
  constructor() {
    super();

    this.state = {games: []};
  }

  componentDidMount() {
    this.fetch();
  }

  async fetch() {
    const {meId} = this.props;
    console.log(`Dashboard fetching games for ${meId}`);
    const market = await getUserMarket();
    const gameRepo = market.getRepo(GameModel);
    const games = await gameRepo.find({userId: meId});
    console.log(`Got ${games.length} games`);
    console.log(`First few: ${JSON.stringify(games.slice(0, 5), null, 2)}`);
    this.setState({ games });
  }

  render () {
    return <Dashboard {...this.props} games={this.state.games}/>;
  }
}

interface IState {
  // TODO types
  games: Array<any>;
}

export default connect<IProps>(DashboardFetcher, {
  state: (state) => ({
    meId: state.session.credentials.me.id,
  }),
  dispatch: (dispatch) => ({
    navigate: dispatcher(dispatch, actions.navigate),
  }),
});
