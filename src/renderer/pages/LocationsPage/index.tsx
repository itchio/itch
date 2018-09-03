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
import { isEmpty, sortBy } from "underscore";

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
        {result && !isEmpty(result.installLocations) ? (
          <ItemList>
            {sortBy(
              result.installLocations,
              location => -location.sizeInfo.installedSize
            ).map(location => (
              <LocationSummary key={location.id} location={location} />
            ))}
          </ItemList>
        ) : null}
      </>
    )
  );

  componentDidMount() {
    dispatchTabPageUpdate(this.props, { label: ["install_locations.manage"] });
  }
}

interface Props extends MeatProps {
  dispatch: Dispatch;
  tab: string;
}

export default withTab(hook()(LocationsPage));
