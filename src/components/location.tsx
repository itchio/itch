import * as React from "react";
import { connect, Dispatchers, actionCreatorsList } from "./connect";

import { IMeatProps } from "./meats/types";

import Games from "./games";

import format from "./format";
import { Space } from "../helpers/space";

import styled, * as styles from "./styles";

import Button from "./basics/button";
import LocationTitleBarExtra from "./location-title-bar-extra";
import { FiltersContainer } from "./filters-container";
import { showInExplorerString } from "../format/show-in-explorer";
import { GameColumn } from "./game-table/table";

const columns = [
  GameColumn.Cover,
  GameColumn.Title,
  GameColumn.LastPlayed,
  GameColumn.PlayTime,
  GameColumn.InstalledSize,
];

const LocationContainer = styled.div`
  ${styles.meat()};
`;

const LargeFiltersContainer = styled(FiltersContainer)`
  padding-top: 12px;
  padding-bottom: 12px;
`;

export class Location extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { tab, tabInstance, browseInstallLocation } = this.props;

    const locationName = Space.fromInstance(tabInstance).firstPathElement();

    return (
      <LocationContainer>
        <LargeFiltersContainer>
          <LocationTitleBarExtra tabInstance={tabInstance} />
          <Button
            icon="folder-open"
            discreet
            onClick={e => browseInstallLocation({ name: locationName })}
          >
            {format(showInExplorerString())}
          </Button>
        </LargeFiltersContainer>

        <Games tab={tab} forcedLayout="table" columns={columns} />
      </LocationContainer>
    );
  }
}

interface IProps extends IMeatProps {}

const actionCreators = actionCreatorsList("browseInstallLocation");

type IDerivedProps = Dispatchers<typeof actionCreators>;

export default connect<IProps>(Location, { actionCreators });
