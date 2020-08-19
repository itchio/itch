import classNames from "classnames";
import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { InstallLocationsListResult } from "common/butlerd/messages";
import { Dispatch } from "common/types";
import { ambientWind } from "common/util/navigation";
import React from "react";
import FiltersContainer from "renderer/basics/FiltersContainer";
import butlerCaller from "renderer/hocs/butlerCaller";
import { hook } from "renderer/hocs/hook";
import { dispatchTabPageUpdate } from "renderer/hocs/tab-utils";
import { withTab } from "renderer/hocs/withTab";
import ItemList from "renderer/pages/common/ItemList";
import Page from "renderer/pages/common/Page";
import {
  FilterGroup,
  FilterOptionButton,
  FilterOptionIcon,
  FilterOptionLink,
  FilterSpacer,
  SortsAndFilters,
} from "renderer/pages/common/SortsAndFilters";
import LocationSummary from "renderer/pages/LocationsPage/LocationSummary";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import { T } from "renderer/t";
import { isEmpty, size, sortBy } from "underscore";
import LoadingCircle from "renderer/basics/LoadingCircle";
import styled from "renderer/styles";

const ListInstallLocations = butlerCaller(messages.InstallLocationsList);

const Spacer = styled.div`
  width: 8px;
`;

class LocationsPage extends React.PureComponent<Props> {
  render() {
    return (
      <Page>
        <ListInstallLocations
          params={{ sequence: this.props.sequence }}
          loadingHandled
          render={this.renderCallContents}
        />
      </Page>
    );
  }

  renderCallContents = ListInstallLocations.renderCallback(
    ({ loading, result }) => {
      const { scanningLocations, locationScanProgress } = this.props;
      return (
        <>
          <FiltersContainer loading={loading} />
          <SortsAndFilters>
            <FilterGroup>
              <FilterOptionLink
                href="itch://scan-install-locations"
                className={classNames({ disabled: scanningLocations })}
              >
                <FilterOptionIcon icon="search" />
                {T(["preferences.scan_install_locations"])}
                {scanningLocations ? (
                  <>
                    <Spacer />
                    <LoadingCircle progress={locationScanProgress} />
                  </>
                ) : null}
              </FilterOptionLink>
            </FilterGroup>
            <FilterSpacer />
            <FilterGroup>
              <FilterOptionButton onClick={this.onAddLocation}>
                <FilterOptionIcon icon="plus" />
                {T(["preferences.install_location.add"])}
              </FilterOptionButton>
            </FilterGroup>
          </SortsAndFilters>
          {this.renderList(result)}
        </>
      );
    }
  );

  renderList = (result: InstallLocationsListResult) => {
    if (!result || isEmpty(result.installLocations)) {
      return null;
    }
    const locations = result.installLocations;
    const numLocations = size(locations);

    return (
      <ItemList>
        {sortBy(
          result.installLocations,
          (location) => -location.sizeInfo.installedSize
        ).map((location) => (
          <LocationSummary
            key={location.id}
            location={location}
            numLocations={numLocations}
          />
        ))}
      </ItemList>
    );
  };

  onAddLocation = (ev: React.MouseEvent<any>) => {
    const { dispatch } = this.props;
    dispatch(actions.addInstallLocation({ wind: ambientWind() }));
  };

  componentDidMount() {
    dispatchTabPageUpdate(this.props, { label: ["install_locations.manage"] });
  }
}

interface Props extends MeatProps {
  dispatch: Dispatch;
  tab: string;
  scanningLocations: boolean;
  locationScanProgress: number;
}

export default withTab(
  hook((map) => ({
    scanningLocations: map((rs) => rs.system.locationScanProgress !== null),
    locationScanProgress: map((rs) => rs.system.locationScanProgress),
  }))(LocationsPage)
);
