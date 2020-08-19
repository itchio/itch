import { ExtendedWindow } from "common/types";
import React from "react";
import HubContent from "renderer/scenes/HubScene/HubContent";
import Sidebar from "renderer/scenes/HubScene/Sidebar/Sidebar";
import styled from "renderer/styles";

const HubSceneDiv = styled.div`
  overflow: hidden;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: row;
`;

class HubScene extends React.PureComponent {
  render() {
    const iw = ((window as unknown) as ExtendedWindow).windSpec;

    return (
      <HubSceneDiv>
        {iw.role == "main" ? <Sidebar /> : null}
        <HubContent />
      </HubSceneDiv>
    );
  }
}

export default HubScene;
