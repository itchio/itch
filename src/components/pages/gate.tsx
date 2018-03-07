import * as React from "react";
import { connect, actionCreatorsList, Dispatchers } from "../connect";

import { resolve } from "path";

import LoginForm from "./gate/login-form";
import RememberedProfiles from "./gate/remembered-profiles";
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

  .logo {
    pointer-events: none;

    display: flex;
    flex-direction: row;
    align-items: center;

    margin: 40px 0;
    min-height: 120px;

    img {
      width: 90%;
      margin: 0 auto;
    }
  }

  .crux {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-self: stretch;
    align-items: center;
  }
`;

export class GatePage extends React.PureComponent<IProps & IDerivedProps> {
  username: HTMLInputElement;
  password: HTMLInputElement;

  render() {
    return (
      <GateDiv>
        <TitleBar tab="login" />
        <section className="logo">
          <img
            src={resolve(__dirname, "../../static/images/logos/app-white.svg")}
          />
        </section>
        <Filler />
        <section className="crux">{this.renderChild()}</section>
        <Filler />
      </GateDiv>
    );
  }

  renderChild() {
    const { blockingOperation, stage } = this.props;

    if (blockingOperation) {
      return <BlockingOperation blockingOperation={blockingOperation} />;
    }

    if (stage === "pick") {
      return <RememberedProfiles />;
    } else {
      return <LoginForm />;
    }
  }
}

interface IProps {}

const actionCreators = actionCreatorsList(
  "loginWithPassword",
  "useSavedLogin",
  "loginStartPicking",
  "loginStopPicking",
  "forgetProfileRequest",
  "retrySetup",
  "openUrl"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  stage: string;
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

    if (login.picking) {
      return { stage: "pick" };
    } else {
      return { stage: "login", blockingOperation: login.blockingOperation };
    }
  },
  actionCreators,
});
