import * as React from "react";
import { connect } from "./connect";

import urls from "../constants/urls";
import * as actions from "../actions";

import Link from "./basics/link";
import Games from "./games";
import GameFilters from "./game-filters";
import TitleBar from "./title-bar";
import { IMeatProps } from "./meats/types";

import { dispatcher } from "../constants/action-types";

import styled, * as styles from "./styles";
import { injectIntl, InjectedIntl } from "react-intl";

const DashboardContainer = styled.div`${styles.meat()};`;

export class Dashboard extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { intl, tab, navigate } = this.props;

    return (
      <DashboardContainer>
        <TitleBar tab={tab} />
        <GameFilters tab={tab}>
          <Link
            label={intl.formatMessage({ id: "outlinks.open_dashboard" })}
            onClick={e => navigate(`url/${urls.dashboard}`)}
          />
        </GameFilters>
        <Games tab={tab} />
      </DashboardContainer>
    );
  }
}

interface IProps extends IMeatProps {}

interface IDerivedProps {
  navigate: typeof actions.navigate;
  intl: InjectedIntl;
}

export default connect<IProps>(injectIntl(Dashboard), {
  dispatch: dispatch => ({
    navigate: dispatcher(dispatch, actions.navigate),
  }),
});
