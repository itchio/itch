import * as React from "react";
import { connect, Dispatchers, actionCreatorsList } from "./connect";

import urls from "../constants/urls";

import Link from "./basics/link";
import Games from "./games";
import GameFilters from "./game-filters";
import TitleBar from "./title-bar";
import { IMeatProps } from "./meats/types";

import styled, * as styles from "./styles";
import format from "./format";

const DashboardContainer = styled.div`${styles.meat()};`;

export class Dashboard extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { tab, navigate } = this.props;

    return (
      <DashboardContainer>
        <TitleBar tab={tab} />
        <GameFilters tab={tab}>
          <Link
            label={format(["outlinks.open_dashboard"])}
            onClick={e => navigate({ tab: `url/${urls.dashboard}` })}
          />
        </GameFilters>
        <Games tab={tab} />
      </DashboardContainer>
    );
  }
}

interface IProps extends IMeatProps {}

const actionCreators = actionCreatorsList("navigate");

type IDerivedProps = Dispatchers<typeof actionCreators>;

export default connect<IProps>(Dashboard, { actionCreators });
