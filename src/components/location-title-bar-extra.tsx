import * as React from "react";
import { ITabInstance } from "../types/index";
import { Space } from "../helpers/space";
import { fileSize } from "../format/filesize";

import styled from "./styles";
import format from "./format";

const SecondaryText = styled.span`
  color: ${props => props.theme.secondaryText};
  margin-right: 0.5em;
`;

export default class LocationTitleBarExtra extends React.PureComponent<IProps> {
  render() {
    const { tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);
    const { size } = sp.location();
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
