import { messages } from "common/butlerd";
import { Dispatch } from "common/types";
import { ambientTab } from "common/util/navigation";
import React from "react";
import butlerCaller from "renderer/hocs/butlerCaller";
import { hookWithProps } from "renderer/hocs/hook";
import { dispatchTabPageUpdate } from "renderer/hocs/tab-utils";
import { withTab } from "renderer/hocs/withTab";
import Page from "renderer/pages/common/Page";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import LocationContents from "renderer/pages/LocationPage/LocationContents";

const InstallLocationsGetByID = butlerCaller(messages.InstallLocationsGetByID);

class LocationPage extends React.PureComponent<Props> {
  render() {
    const { installLocationId } = this.props;

    return (
      <Page>
        <InstallLocationsGetByID
          params={{ id: installLocationId }}
          onResult={this.onResult}
          loadingHandled
          render={this.renderCallContents}
        />
      </Page>
    );
  }

  onResult = InstallLocationsGetByID.onResultCallback((result) => {
    if (!(result && result.installLocation)) {
      return;
    }
    const loc = result.installLocation;
    dispatchTabPageUpdate(this.props, { label: `${loc.path}` });
  });

  renderCallContents = InstallLocationsGetByID.renderCallback(({ result }) => {
    return (
      <LocationContents location={result ? result.installLocation : null} />
    );
  });
}

interface Props extends MeatProps {
  dispatch: Dispatch;
  tab: string;

  installLocationId: string;
  sortBy: string;
  sortDir: string;
}

export default withTab(
  hookWithProps(LocationPage)((map) => ({
    installLocationId: map(
      (rs, props) => ambientTab(rs, props).location.firstPathElement
    ),
    sortBy: map((rs, props) => ambientTab(rs, props).location.query.sortBy),
    sortDir: map((rs, props) => ambientTab(rs, props).location.query.sortDir),
  }))(LocationPage)
);
