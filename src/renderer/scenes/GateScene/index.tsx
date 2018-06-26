import { RootState, SetupOperation } from "common/types";
import React from "react";
import Filler from "renderer/basics/Filler";
import TitleBar from "renderer/basics/TitleBar";
import { connect } from "renderer/hocs/connect";
import BlockingOperation from "renderer/scenes/GateScene/BlockingOperation";
import LoginScreen from "renderer/scenes/GateScene/LoginScreen";
import LogoIndicator from "renderer/scenes/GateScene/LogoIndicator";
import styled from "renderer/styles";

const GateDiv = styled.div`
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

class GatePage extends React.PureComponent<Props & DerivedProps> {
  username: HTMLInputElement;
  password: HTMLInputElement;

  render() {
    return (
      <GateDiv>
        <TitleBar tab="login" />
        <LogoIndicator />
        <Filler />
        <section className="crux">{this.renderChild()}</section>
        <Filler />
      </GateDiv>
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

interface Props {}

interface DerivedProps {
  stage: "setup" | "login";
  errors?: string[];
  blockingOperation?: SetupOperation;
}

export default connect<Props>(
  GatePage,
  {
    state: (rs: RootState): Partial<DerivedProps> => {
      const { profile } = rs;
      const { login } = profile;

      if (!rs.setup.done) {
        return {
          stage: "setup",
          errors: rs.setup.errors,
          blockingOperation: rs.setup.blockingOperation,
        };
      }
      return { stage: "login", blockingOperation: login.blockingOperation };
    },
  }
);
