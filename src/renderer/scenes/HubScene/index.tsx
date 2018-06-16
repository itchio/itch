import { ExtendedWindow } from "common/types";
import React from "react";
import HubContent from "renderer/scenes/HubScene/HubContent";
import Sidebar from "renderer/scenes/HubScene/Sidebar/Sidebar";
import SidebarHandle from "renderer/scenes/HubScene/Sidebar/SidebarHandle";
import styled from "renderer/styles";

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
