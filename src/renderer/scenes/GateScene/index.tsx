import { SetupOperation } from "common/types";
import React from "react";
import Filler from "renderer/basics/Filler";
import TitleBar from "renderer/basics/TitleBar";
import { hook } from "renderer/hocs/hook";
import BlockingOperation from "renderer/scenes/GateScene/BlockingOperation";
import LoginScreen from "renderer/scenes/GateScene/LoginScreen";
import LogoIndicator from "renderer/scenes/GateScene/LogoIndicator";
import styled from "renderer/styles";

const GateSceneDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  height: 100%;

  .crux {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-self: stretch;
    align-items: center;
  }
`;

class GateScene extends React.PureComponent<Props> {
  override render() {
    return (
      <GateSceneDiv>
        <TitleBar tab="login" />
        <LogoIndicator />
        <Filler />
        <section className="crux">{this.renderChild()}</section>
        <Filler />
      </GateSceneDiv>
    );
  }

  renderChild() {
    const { blockingOperation } = this.props;

    if (blockingOperation) {
      return <BlockingOperation blockingOperation={blockingOperation} />;
    }
    return <LoginScreen />;
  }
}

interface Props {
  blockingOperation: SetupOperation | null;
}

export default hook((map) => ({
  blockingOperation: map((rs) =>
    rs.setup.done
      ? rs.profile.login.blockingOperation
      : rs.setup.blockingOperation
  ),
}))(GateScene);
