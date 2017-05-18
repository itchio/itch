
import * as React from "react";
import {connect, I18nProps} from "./connect";
import {createStructuredSelector} from "reselect";

import urls from "../constants/urls";
import * as actions from "../actions";

import Link from "./basics/link";
import Games from "./games";
import GameFilters from "./game-filters";

import {dispatcher} from "../constants/action-types";

import {values} from "underscore";

import styled, * as styles from "./styles";

const DashboardContainer = styled.div`
  ${styles.meat()}
`;

const tab = "dashboard";

export class Dashboard extends React.PureComponent<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, games, navigate} = this.props;

    return <DashboardContainer>
      <GameFilters tab={tab}>
        <Link
          label={t("outlinks.open_dashboard")}
          onClick={(e) => navigate(`url/${urls.dashboard}`)}
        />
      </GameFilters>
      <Games tab={tab} games={values(games)}/>
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

const emptyObj = {};

export default connect<IProps>(Dashboard, {
  state: createStructuredSelector({
    meId: (state) => state.session.credentials.me.id,
    games: (state) => (state.session.tabData[tab] || emptyObj).games || emptyObj,
  }),
  dispatch: (dispatch) => ({
    navigate: dispatcher(dispatch, actions.navigate),
  }),
});
