import React from "react";
import { ITabInstance } from "common/types";
import { Space } from "common/helpers/space";
import { fileSize } from "common/format/filesize";

import styled from "./styles";
import { T } from "renderer/t";

const SecondaryText = styled.span`
  color: ${props => props.theme.secondaryText};
  margin-right: 0.5em;
`;

class LocationTitleBarExtra extends React.PureComponent<IProps> {
  render() {
    const { tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);
    const { size } = sp.location();
    if (!(size > 0)) {
      return null;
    }

    return (
      <SecondaryText>
        {T([
          "install_location.property.size_on_disk",
          { size: fileSize(size) },
        ])}
      </SecondaryText>
    );
  }
}

export default LocationTitleBarExtra;

interface IProps {
  tabInstance: ITabInstance;
}
