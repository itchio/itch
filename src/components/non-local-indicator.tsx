import * as React from "react";
import urls from "../constants/urls";

import styled, * as styles from "./styles";

const IndicatorDiv = styled.div`
  position: absolute;
  left: 50%;
  bottom: 8px;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.4);
  color: ${styles.colors.secondaryTextHover};
  box-shadow: 0 0 2px ${styles.colors.baseBackground};
  border: 1px solid ${styles.colors.secondaryText};
  border-radius: 1px;
  font-size: 16px;
  padding: 6px;
  pointer-events: none;
`;

export default class NonLocalIndicator extends React.PureComponent<{}, {}> {
  render() {
    if (urls.itchio === urls.originalItchio) {
      return null;
    }

    return (
      <IndicatorDiv title="itch is running off a private itch.io instance">
        {urls.itchio}
      </IndicatorDiv>
    );
  }
}
