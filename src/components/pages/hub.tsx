
import * as React from "react";

import Sidebar from "../sidebar";
import SidebarHandle from "../sidebar-handle";
import HubContent from "../hub-content";

import styled, * as styles from "../styles";

const HubPageDiv = styled.div`
  overflow: hidden;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: row;

  animation: ${styles.animations.fadeIn} .4s ease-in;
`;

class HubPage extends React.PureComponent<void, void> {
  render () {
    return <HubPageDiv>
      <Sidebar/>
      <SidebarHandle/>
      <HubContent/>
    </HubPageDiv>;
  }
}

export default HubPage;
