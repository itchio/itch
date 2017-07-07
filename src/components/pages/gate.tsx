import * as classNames from "classnames";
import * as React from "react";
import { connect } from "../connect";

import { isEmpty, map, sortBy, size } from "underscore";
import { resolve } from "path";

import urls from "../../constants/urls";

import ErrorList from "./gate/error-list";
import RememberedSession from "./gate/remembered-session";
import Icon from "../basics/icon";
import LoadingCircle from "../basics/loading-circle";
import Link from "../basics/link";
import Button from "../basics/button";
import Filler from "../basics/filler";

import TitleBar from "../title-bar";

import { reportIssue, IReportIssueOpts } from "../../util/crash-reporter";

import * as actions from "../../actions";

import { ISetupOperation, IRememberedSessionsState } from "../../types";
import {
  dispatcher,
  ILoginWithTokenPayload,
} from "../../constants/action-types";

import format, { formatString } from "../format";
import { injectIntl, InjectedIntl } from "react-intl";

import watching, { Watcher } from "../watching";

import styled, * as styles from "../styles";

const Spacer = styled.div`
  flex-basis: 8px;
  flex-grow: 0;
  flex-shrink: 0;
`;

const GateDiv = styled.div`
  animation: drop-down .3s ease-in;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;

  section {
    flex-grow: 0;
  }

  .top-filler {
    flex-grow: 1;
  }

  .logo {
    flex-grow: 1;
    pointer-events: none;

    display: flex;
    flex-direction: row;
    align-items: center;

    img {
      width: 90%;
      margin: 0 auto;
    }
  }

  .errors {
    transition: all 0.4s;
    color: ${props => props.theme.warning};
    height: 4em;
    width: 100%;
    max-width: 500px;
    white-space: pre-wrap;
    overflow-y: auto;

    -webkit-user-select: initial;

    &.hasError {
      height: 8em;
      padding: 8px;
    }

    li {
      margin: 4px 0;
      line-height: 1.4;
    }

    .icon {
      margin-right: 4px;
    }

    .welcome-back {
      color: ${props => props.theme.baseText};
      font-size: 18px;
      display: flex;
    }
  }

  .errors,
  .actions {
    .status-container .icon {
      margin-right: .4em;
      font-size: 120%;
      vertical-align: middle;
    }
  }

  .crux {
    flex-grow: .2;
    display: flex;
    flex-direction: column;
    align-self: stretch;
    align-items: center;
  }

  .actions {
    position: relative;
    color: ${props => props.theme.secondaryText};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 160px;
    min-height: 160px;

    .icon.scanning {
      ${styles.horizontalScan()};
      margin-right: 12px;
    }
  }

  .links {
    flex-grow: 1;
    font-size: 16px;
    transition: 0 .2s;
    margin: 1em 0;
    color: $swiss-coffee;
  }

  &.disabled {
    form input,
    .links {
      pointer-events: none;
      opacity: 0;
    }
  }

  &[data-stage='pick'] {
    form input {
      pointer-events: none;
      opacity: 0;
    }
  }

  &[data-stage='ready'] {
    .crux,
    .links,
    .actions,
    .errors {
      pointer-events: none;
      opacity: 0;
    }

    .top-filler {
      transition: all 0.8s;
      flex-grow: 10;
    }

    .logo {
      transition: all 0.8s ease-in;
      opacity: 0;
    }
  }

  .status-container {
    font-size: ${props => props.theme.fontSizes.large};
  }

  .status-container.error {
    line-height: 1.4;
    white-space: pre;
    text-align: center;

    .error-actions {
      margin: 20px;
    }
  }
`;

const Form = styled.form`
  width: 60%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-self: center;
  position: relative;

  input {
    ${styles.heavyInput()} font-size: ${props => props.theme.fontSizes.large};

    transform: scale(1.0) rotateZ(0deg);
    transition: all 0.2s;

    &[disabled] {
      transform: scale(0.96);
      opacity: 0;
    }
  }

  input[type='text']:focus {
    transform: scale(1.08) rotateZ(0.5deg);
  }

  input[type='password']:focus {
    transform: scale(1.07) rotateZ(-0.3deg);
  }

  input[type='submit']:focus {
    transform: scale(1.06) rotateZ(0deg);
  }
`;

const RememberedSessions = styled.div`
  animation: fade-in .2s;

  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow-y: auto;
`;

@watching
export class GatePage extends React.PureComponent<IProps & IDerivedProps> {
  username: HTMLInputElement;
  password: HTMLInputElement;

  subscribe(watcher: Watcher) {
    watcher.on(actions.loginFailed, async (store, action) => {
      const { username } = this;
      if (username) {
        username.value = action.payload.username;
      }
    });
  }

  render() {
    const { intl, stage, blockingOperation } = this.props;
    const disabled = !!blockingOperation;

    return (
      <GateDiv className={classNames({ disabled })} data-stage={stage}>
        <TitleBar tab="login" />
        <section className="top-filler" />
        <section className="logo">
          <img
            src={resolve(__dirname, "../../static/images/logos/app-white.svg")}
          />
        </section>

        {this.errors()}

        <section className="crux">
          <Form onSubmit={this.handleSubmit}>
            <input
              id="login-username"
              ref={this.gotUsernameField}
              type="text"
              placeholder={formatString(intl, ["login.field.username"])}
              onKeyDown={this.handleKeyDown}
              disabled={disabled}
            />
            <input
              id="login-password"
              ref={this.gotPasswordField}
              type="password"
              placeholder={formatString(intl, ["login.field.password"])}
              disabled={disabled}
              onKeyDown={this.handleKeyDown}
            />
            <section className="actions">
              {this.renderActions()}
            </section>
          </Form>
        </section>

        {this.links()}
      </GateDiv>
    );
  }

  errors() {
    const { errors, stage } = this.props;

    if (stage === "pick") {
      return (
        <section className="errors">
          <span className="welcome-back">
            <Filler />
            <Icon icon="heart-filled" />
            <Spacer />
            {format(["login.messages.welcome_back"])}
            <Filler />
          </span>
        </section>
      );
    } else {
      return (
        <section
          className={classNames("errors", { hasError: !isEmpty(errors) })}
        >
          <ErrorList
            id="login-errors"
            errors={errors}
            before={<Icon icon="neutral" />}
            i18nNamespace="api.login"
          />
        </section>
      );
    }
  }

  links() {
    const { stage, openUrl, loginStopPicking } = this.props;

    if (stage === "pick") {
      return (
        <section className="links">
          <Link
            label={format(["login.action.show_form"])}
            onClick={() => loginStopPicking({})}
          />
        </section>
      );
    } else {
      const { rememberedSessions = {} } = this.props;
      const numSavedSessions = Object.keys(rememberedSessions).length;

      return (
        <section className="links">
          <Link
            label={format(["login.action.register"])}
            onClick={() => openUrl({ url: urls.accountRegister })}
          />
          <span>
            {" · "}
          </span>
          <Link
            label={format(["login.action.reset_password"])}
            onClick={() => openUrl({ url: urls.accountForgotPassword })}
          />
          {numSavedSessions > 0
            ? [
                <span key="separator">
                  {" · "}
                </span>,
                <Link
                  key="show-saved-logins"
                  label={format(["login.action.show_saved_logins"])}
                  onClick={this.onStartPicking}
                />,
              ]
            : ""}
        </section>
      );
    }
  }

  renderActions() {
    const {
      intl,
      blockingOperation,
      rememberedSessions = {},
      stage,
      retrySetup,
    } = this.props;

    if (stage === "pick") {
      const onLogin = (payload: ILoginWithTokenPayload): any => {
        const { username } = this.refs;
        if (username) {
          (username as HTMLInputElement).value = payload.username;
        }
        this.props.loginWithToken(payload);
      };

      return (
        <RememberedSessions>
          {map(
            sortBy(rememberedSessions, x => -x.lastConnected),
            (session, userId) =>
              <RememberedSession
                key={userId}
                session={session}
                onLogin={onLogin}
              />,
          )}
        </RememberedSessions>
      );
    }

    if (blockingOperation) {
      const { message, icon } = blockingOperation;
      const translatedMessage = formatString(intl, message);
      const hasError = icon === "error";
      let iconElement: JSX.Element;
      if (hasError) {
        iconElement = <Icon icon={icon} />;
      } else {
        iconElement = <LoadingCircle progress={0.3} />;
      }

      return (
        <div className={classNames("status-container", { error: hasError })}>
          {iconElement}
          {translatedMessage}
          {hasError
            ? <div className="error-actions">
                <Button
                  discreet
                  icon="repeat"
                  label={format(["login.action.retry_setup"])}
                  onClick={() => retrySetup({})}
                />
                <Button
                  discreet
                  icon="bug"
                  label={format(["grid.item.report_problem"])}
                  onClick={this.onReportBlockingOperation}
                />
              </div>
            : null}
        </div>
      );
    } else {
      const translatedMessage = formatString(intl, ["login.action.login"]);
      return (
        <Button
          id="login-button"
          fat
          primary
          label={translatedMessage}
          onClick={this.handleSubmit}
        />
      );
    }
  }

  reportIssue(blockingOperation: ISetupOperation) {
    reportIssue(
      {
        type: "Trouble in setup",
        body: blockingOperation.stack,
      } as IReportIssueOpts,
    );
  }

  componentDidUpdate(prevProps: IDerivedProps) {
    // so very reacty...
    if (!this.props.blockingOperation && size(this.props.errors) > 0) {
      this.handleLoginFailure();
    }

    if (prevProps.stage === "pick" && this.props.stage === "login") {
      this.handleStoppedPicking();
    }
  }

  handleKeyDown = e => {
    if (e.key === "Enter") {
      this.handleSubmit();
    }
  };

  handleSubmit = () => {
    const { username, password } = this;
    this.props.loginWithPassword({
      username: username.value,
      password: password.value,
    });
  };

  handleStoppedPicking = () => {
    const username = this.username;
    if (username) {
      username.focus();
    }
  };

  handleLoginFailure = () => {
    const { username, password } = this;
    if (username && username.value === "") {
      username.focus();
    } else if (password) {
      password.focus();
    }
  };

  gotUsernameField = username => {
    this.username = username;
  };

  gotPasswordField = password => {
    this.password = password;
  };

  onStartPicking = () => {
    this.props.loginStartPicking({});
  };

  onReportBlockingOperation = () => {
    const { blockingOperation } = this.props;
    if (blockingOperation) {
      this.reportIssue(blockingOperation);
    }
  };
}

interface IProps {}

interface IDerivedProps {
  stage: string;
  errors: string[];
  blockingOperation?: ISetupOperation;
  rememberedSessions: IRememberedSessionsState;
  loginWithPassword: typeof actions.loginWithPassword;
  loginWithToken: typeof actions.loginWithToken;
  loginStartPicking: typeof actions.loginStartPicking;
  loginStopPicking: typeof actions.loginStopPicking;
  forgetSessionRequest: typeof actions.forgetSessionRequest;
  retrySetup: typeof actions.retrySetup;
  openUrl: typeof actions.openUrl;

  intl: InjectedIntl;
}

export default connect<IProps>(injectIntl(GatePage), {
  state: (state): Partial<IDerivedProps> => {
    const { rememberedSessions, session } = state;
    const { login } = session;

    if (!session.credentials.key) {
      const hasSessions = Object.keys(rememberedSessions).length > 0;
      const stage =
        !login.blockingOperation && hasSessions && login.picking
          ? "pick"
          : "login";
      return { ...login, stage, rememberedSessions };
    } else if (!state.setup.done) {
      return { stage: "setup", ...state.setup };
    } else {
      return { stage: "ready", errors: [], blockingOperation: null };
    }
  },
  dispatch: (dispatch): Partial<IDerivedProps> => ({
    loginWithPassword: dispatcher(dispatch, actions.loginWithPassword),
    loginWithToken: dispatcher(dispatch, actions.loginWithToken),
    loginStartPicking: dispatcher(dispatch, actions.loginStartPicking),
    loginStopPicking: dispatcher(dispatch, actions.loginStopPicking),
    forgetSessionRequest: dispatcher(dispatch, actions.forgetSessionRequest),
    retrySetup: dispatcher(dispatch, actions.retrySetup),
    openUrl: dispatcher(dispatch, actions.openUrl),
  }),
});
