
import * as classNames from "classnames";
import * as React from "react";
import {connect, I18nProps} from "../connect";

import {map, sortBy} from "underscore";
import {resolve} from "path";

import urls from "../../constants/urls";

import ErrorList from "./gate/error-list";
import RememberedSession from "./gate/remembered-session";
import Icon from "../basics/icon";
import Link from "../basics/link";
import Button from "../basics/button";

import * as actions from "../../actions";

import {ISetupOperation, IRememberedSessionsState} from "../../types";
import {dispatcher, ILoginWithTokenPayload} from "../../constants/action-types";

import watching, {Watcher} from "../watching";

import styled, * as styles from "../styles";

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
    color: ${props => props.theme.warning};
    height: 4em;
    max-width: 400px;
    white-space: pre-wrap;
    overflow-y: auto;

    -webkit-user-select: initial;

    li {
      margin: 4px 0;
      line-height: 1.4;
    }

    .welcome-back {
      color: ${props => props.theme.baseText};
      font-size: 18px;
    }
  }

  .errors, .actions {
    .icon {
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
      @include horizontal-scan;
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
    form input, .links {
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
    .crux, .links, .actions, .errors {
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

  .status-container.error {
    line-height: 1.4;
    font-size: 16px;
    white-space: pre;
    text-align: center;

    .retry-setup {
      display: block;
      font-size: 48px;
      margin: 20px;

      @include clickable;
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
    ${styles.heavyInput()}

    font-size: ${props => props.theme.fontSizes.large};

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
export class GatePage extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  refs: {
    username: HTMLInputElement;
    password: HTMLInputElement;
  };

  constructor () {
    super();
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleLoginFailure = this.handleLoginFailure.bind(this);
  }

  subscribe (watcher: Watcher) {
    watcher.on(actions.loginFailed, async (store, action) => {
      const {username} = this.refs;
      if (username) {
        username.value = action.payload.username;
      }
    });
  }

  render () {
    const {t, stage, blockingOperation} = this.props;
    const disabled = !!blockingOperation;

    return <GateDiv className={classNames({disabled})} data-stage={stage}>
      <section className="top-filler"/>
      <section className="logo">
        <img src={resolve(__dirname, "../../static/images/logos/app-white.svg")}/>
      </section>

      {this.errors()}

      <section className="crux">
        <Form onSubmit={this.handleSubmit}>
          <input id="login-username" ref="username" type="text"
            placeholder={t("login.field.username")} autoFocus disabled={disabled}/>
          <input ref="password" type="password" placeholder={t("login.field.password")} disabled={disabled}/>
          <section className="actions">
            {this.renderActions()}
          </section>
        </Form>
      </section>

      {this.links()}
    </GateDiv>;
  }

  errors () {
    const {t, errors, stage} = this.props;

    if (stage === "pick") {
      return <section className="errors">
        <span className="welcome-back">
          <Icon icon="heart-filled"/>
          {t("login.messages.welcome_back")}
        </span>
      </section>;
    } else {
      return <section className="errors">
        <ErrorList errors={errors} before={<Icon icon="neutral"/>} i18nNamespace="api.login"/>
      </section>;
    }
  }

  links () {
    const {t, stage, openUrl, loginStopPicking} = this.props;

    if (stage === "pick") {
      return <section className="links">
        <Link
          label={t("login.action.show_form")}
          onClick={() => loginStopPicking({})}
        />
      </section>;
    } else {
      const {rememberedSessions = {}} = this.props;
      const numSavedSessions = Object.keys(rememberedSessions).length;

      return <section className="links">
        <Link
          label={t("login.action.register")}
          onClick={() => openUrl({url: urls.accountRegister})}
        />
        <span>{" · "}</span>
        <Link
          label={t("login.action.reset_password")}
          onClick={() => openUrl({url: urls.accountForgotPassword})}
        />
        {numSavedSessions > 0
        ? [
          <span key="separator">{" · "}</span>,
          <Link
            label={t("login.action.show_saved_logins")}
            onClick={() => this.props.loginStartPicking({})}
          />,
        ]
        : ""}
      </section>;
    }
  }

  renderActions () {
    const {t, blockingOperation, rememberedSessions = {}, stage, retrySetup} = this.props;

    if (stage === "pick") {
      const onLogin = (payload: ILoginWithTokenPayload): any => {
        const {username} = this.refs;
        if (username) {
          (username as HTMLInputElement).value = payload.username;
        }
        this.props.loginWithToken(payload);
      };

      return <RememberedSessions>
        {map(sortBy(rememberedSessions, (x) => -x.lastConnected), (session, userId) =>
          <RememberedSession key={userId} session={session} onLogin={onLogin}/>,
        )}
      </RememberedSessions>;
    }
    
    if (blockingOperation) {
      const {message, icon} = blockingOperation;
      const translatedMessage = t.format(message);
      const hasError = icon === "error";
      const classes = classNames(`icon icon-${icon}`, {scanning: !hasError});
      const pClasses = classNames("status-container", {error: hasError});

      return <p className={pClasses}>
        <span className={classes}/>
        {translatedMessage}
        {hasError
          ? <span className="icon icon-repeat retry-setup" onClick={() => retrySetup({})}/>
          : ""
        }
      </p>;
    } else {
      const translatedMessage = t("login.action.login");
      return <Button fat primary label={translatedMessage}/>;
    }
  }

  componentWillReceiveProps (nextProps: IDerivedProps) {
    // so very reacty...
    if (!nextProps.blockingOperation && nextProps.errors && nextProps.errors.length) {
      this.handleLoginFailure();
    }

    if (this.props.stage === "pick" && nextProps.stage === "login") {
      this.handleStoppedPicking();
    }
  }

  handleSubmit (e: React.FormEvent<any>) {
    e.preventDefault();
    const {username, password} = this.refs;
    this.props.loginWithPassword({
      username: username.value,
      password: password.value,
    });
  }

  handleStoppedPicking () {
    const username = this.refs.username;
    if (username) {
      setTimeout(() => username.focus(), 200);
    }
  }

  handleLoginFailure () {
    const {password} = this.refs;
    if (password) {
      setTimeout(() => password.focus(), 200);
    }
  }
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
}

export default connect<IProps>(GatePage, {
  state: (state): Partial<IDerivedProps> => {
    const { rememberedSessions, session } = state;
    const { login } = session;

    if (!session.credentials.key) {
      const hasSessions = Object.keys(rememberedSessions).length > 0;
      const stage = (!login.blockingOperation && hasSessions && login.picking) ? "pick" : "login";
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
