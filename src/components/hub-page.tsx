
import * as React from "react";

import HubSidebar from "./hub-sidebar";
import HubSidebarHandle from "./hub-sidebar-handle";
import HubContent from "./hub-content";

import styled from "styled-components";

const HubPageContainer = styled.div`
  overflow: hidden;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: row;
`;

export class HubPage extends React.Component<void, void> {
  render () {
    return <HubPageContainer>
      <HubSidebar/>
      <HubSidebarHandle/>
      <HubContent/>
    </HubPageContainer>;
  }
}

export default HubPage;
