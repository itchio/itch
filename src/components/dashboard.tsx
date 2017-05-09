
import * as React from "react";
import * as PropTypes from "prop-types";
import {connect, I18nProps} from "./connect";

import urls from "../constants/urls";
import * as actions from "../actions";

import Link from "./basics/link";
import Games from "./games";
import GameFilters from "./game-filters";

import {dispatcher} from "../constants/action-types";

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
  static contextTypes = {
    market: PropTypes.object,
  };

  constructor() {
    super();

    this.state = {games: []};
  }

  componentDidMount() {
    this.fetch();
  }

  async fetch() {
    if (!this.context.market) {
      console.warn(`no market, can't fetch`);
      return;
    }

    const {meId} = this.props;
    const gameRepo = this.context.market.getRepo(GameModel);
    const games = await gameRepo.find({userId: meId});
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
