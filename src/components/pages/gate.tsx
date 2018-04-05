import React from "react";
import { connect, actionCreatorsList, Dispatchers } from "../connect";

import LogoIndicator from "./gate/logo-indicator";
import LoginScreen from "./gate/login-screen";
import BlockingOperation from "./gate/blocking-operation";
import TitleBar from "../title-bar";
import Filler from "../basics/filler";

import { ISetupOperation, IRootState } from "../../types";

import styled from "../styles";

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

class GatePage extends React.PureComponent<IProps & IDerivedProps> {
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

interface IProps {}

const actionCreators = actionCreatorsList(
  "loginWithPassword",
  "useSavedLogin",
  "forgetProfileRequest",
  "retrySetup"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  stage: "setup" | "login";
  errors?: string[];
  blockingOperation?: ISetupOperation;
};

export default connect<IProps>(GatePage, {
  state: (rs: IRootState): Partial<IDerivedProps> => {
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
  actionCreators,
});
