import React from "react";

import Sidebar from "../sidebar";
import SidebarHandle from "../sidebar-handle";
import HubContent from "../hub-content";

import styled from "../styles";
import { ExtendedWindow } from "common/types";

const HubPageDiv = styled.div`
  overflow: hidden;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: row;
`;

class HubPage extends React.PureComponent {
  render() {
    const iw = (window as ExtendedWindow).itchWindow;

    return (
      <HubPageDiv>
        {iw.role == "main" ? (
          <>
            <Sidebar />
            <SidebarHandle />
          </>
        ) : null}
        <HubContent />
      </HubPageDiv>
    );
  }
}

export default HubPage;
