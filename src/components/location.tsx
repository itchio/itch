import * as React from "react";
import { connect } from "./connect";

import * as actions from "../actions";

import { IMeatProps } from "./meats/types";

import Games from "./games";
import GameFilters from "./game-filters";

import { dispatcher } from "../constants/action-types";
import format from "./format";
import { Space } from "../helpers/space";

export class Location extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { tab, tabData, browseInstallLocation } = this.props;

    const locationName = new Space(tabData).suffix;

    return (
      <div className="location-meat">
        <GameFilters tab={tab}>
          <span
            className="link"
            onClick={e => browseInstallLocation({ name: locationName })}
          >
            {format(["grid.item.show_local_files"])}
          </span>
        </GameFilters>

        <Games tab={tab} />
      </div>
    );
  }
}

interface IProps extends IMeatProps {}

interface IDerivedProps {
  browseInstallLocation: typeof actions.browseInstallLocation;
}

export default connect<IProps>(Location, {
  dispatch: (dispatch): Partial<IDerivedProps> => ({
    browseInstallLocation: dispatcher(dispatch, actions.browseInstallLocation),
  }),
});
