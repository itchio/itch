import React from "react";
import { connect, Dispatchers, actionCreatorsList } from "./connect";

import urls from "common/constants/urls";

import Link from "./basics/link";
import Games from "./games";
import GameFilters from "./game-filters";
import { MeatProps } from "renderer/components/meats/types";

import styled, * as styles from "./styles";
import { T } from "renderer/t";
import { rendererWindow } from "common/util/navigation";

const DashboardContainer = styled.div`
  ${styles.meat()};
`;

class Dashboard extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { loading, navigate } = this.props;

    return (
      <DashboardContainer>
        <GameFilters loading={loading}>
          <Link
            label={T(["outlinks.open_dashboard"])}
            onClick={e =>
              navigate({ window: rendererWindow(), url: urls.dashboard })
            }
          />
        </GameFilters>
        <Games />
      </DashboardContainer>
    );
  }
}

interface IProps extends MeatProps {}

const actionCreators = actionCreatorsList("navigate");

type IDerivedProps = Dispatchers<typeof actionCreators>;

export default connect<IProps>(
  Dashboard,
  { actionCreators }
);
