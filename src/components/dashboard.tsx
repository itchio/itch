import * as React from "react";
import { connect, Dispatchers, actionCreatorsList } from "./connect";

import urls from "../constants/urls";

import Link from "./basics/link";
import Games from "./games";
import GameFilters from "./game-filters";
import { IMeatProps } from "./meats/types";

import styled, * as styles from "./styles";
import format from "./format";

const DashboardContainer = styled.div`
  ${styles.meat()};
`;

class Dashboard extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { tab, loading, navigate } = this.props;

    return (
      <DashboardContainer>
        <GameFilters tab={tab} loading={loading}>
          <Link
            label={format(["outlinks.open_dashboard"])}
            onClick={e => navigate({ url: urls.dashboard })}
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
