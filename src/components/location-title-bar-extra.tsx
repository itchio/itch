import * as React from "react";
import { ITabInstance, ICommonsState, IRootState } from "../types/index";
import { connect } from "./connect";
import { createSelector } from "reselect";
import { Space } from "../helpers/space";
import { fileSize } from "../format/filesize";

import styled from "./styles";
import format from "./format";

const SecondaryText = styled.span`
  color: ${props => props.theme.secondaryText};
  margin-right: 0.5em;
`;

class LocationTitleBarExtra extends React.PureComponent<
  IProps & IDerivedProps
> {
  render() {
    const { tabInstance, locationSizes } = this.props;
    const sp = Space.fromInstance(tabInstance);
    const size = locationSizes[sp.stringId()];
    if (!(size > 0)) {
      return null;
    }

    return (
      <SecondaryText>
        {format([
          "install_location.property.size_on_disk",
          { size: fileSize(size) },
        ])}
      </SecondaryText>
    );
  }
}

interface IProps {
  tabInstance: ITabInstance;
}

interface IDerivedProps {
  locationSizes: ICommonsState["locationSizes"];
}

export default connect<IProps>(LocationTitleBarExtra, {
  state: createSelector(
    (rs: IRootState) => rs.commons.locationSizes,
    locationSizes => ({ locationSizes })
  ),
});
