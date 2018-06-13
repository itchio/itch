import React from "react";

import { MeatProps } from "renderer/components/meats/types";

import Games from "./games";

import { Space } from "common/helpers/space";

import styled, * as styles from "./styles";

import Link from "./basics/link";
import LocationTitleBarExtra from "./location-title-bar-extra";
import FiltersContainer from "./filters-container";
import { showInExplorerString } from "common/format/show-in-explorer";
import { GameColumn } from "./game-table/table";
import { T } from "renderer/t";
import { actions } from "common/actions";
import { ITabInstance } from "common/types";
import { Dispatch, withDispatch } from "./dispatch-provider";
import { withTabInstance } from "./meats/tab-instance-provider";

const columns = [
  GameColumn.Cover,
  GameColumn.Title,
  GameColumn.LastPlayed,
  GameColumn.PlayTime,
  GameColumn.InstalledSize,
  GameColumn.InstallStatus,
];

const LocationContainer = styled.div`
  ${styles.meat()};
`;

class Location extends React.PureComponent<Props> {
  render() {
    const { tabInstance, loading } = this.props;

    const installLocationId = Space.fromInstance(
      tabInstance
    ).firstPathElement();

    return (
      <LocationContainer>
        <FiltersContainer loading={loading}>
          <LocationTitleBarExtra tabInstance={tabInstance} />
          <Link
            label={T(showInExplorerString())}
            onClick={e =>
              this.props.dispatch(
                actions.browseInstallLocation({ id: installLocationId })
              )
            }
          />
        </FiltersContainer>

        <Games forcedLayout="table" columns={columns} ignoreFilters />
      </LocationContainer>
    );
  }
}

interface Props extends MeatProps {
  tabInstance: ITabInstance;
  dispatch: Dispatch;
}

export default withTabInstance(withDispatch(Location));
