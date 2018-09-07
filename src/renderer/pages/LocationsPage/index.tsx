import { messages } from "common/butlerd";
import { Dispatch } from "common/types";
import React from "react";
import FiltersContainer from "renderer/basics/FiltersContainer";
import butlerCaller from "renderer/hocs/butlerCaller";
import { hook } from "renderer/hocs/hook";
import { dispatchTabPageUpdate } from "renderer/hocs/tab-utils";
import { withTab } from "renderer/hocs/withTab";
import ItemList from "renderer/pages/common/ItemList";
import Page from "renderer/pages/common/Page";
import LocationSummary from "renderer/pages/LocationsPage/LocationSummary";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import { isEmpty, size, sortBy } from "underscore";
import {
  SortsAndFilters,
  FilterGroup,
  FilterOptionLink,
  FilterOptionIcon,
  FilterSpacer,
  FilterOptionButton,
} from "renderer/pages/common/SortsAndFilters";
import { T, _ } from "renderer/t";
import Button from "renderer/basics/Button";
import { actions } from "common/actions";
import { ambientWind } from "common/util/navigation";
import { InstallLocationsListResult } from "common/butlerd/messages";

const ListInstallLocations = butlerCaller(messages.InstallLocationsList);

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
    ({ loading, result }) => (
      <>
        <FiltersContainer loading={loading} />
        <SortsAndFilters>
          <FilterGroup>
            <FilterOptionLink href="itch://scan-install-locations">
              <FilterOptionIcon icon="search" />
              {T(["preferences.scan_install_locations"])}
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
    )
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
          location => -location.sizeInfo.installedSize
        ).map(location => (
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
}

export default withTab(hook()(LocationsPage));
