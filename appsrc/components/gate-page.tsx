
import * as classNames from "classnames";
import * as React from "react";
import {connect} from "./connect";

import {map, sortBy} from "underscore";

import urls from "../constants/urls";

import ErrorList from "./error-list";
import Icon from "./icon";

import RememberedSession from "./remembered-session";

import * as actions from "../actions";

import {IState, ISetupOperation, IRememberedSessionsState, Partial} from "../types";
import {IDispatch, dispatcher, ILoginWithTokenPayload} from "../constants/action-types";
import {ILocalizer} from "../localizer";

import watching, {Watcher} from "./watching";

@watching
export class GatePage extends React.Component<IGatePageProps> {
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
    const {t, stage, blockingOperation, halloween} = this.props;
    const disabled = !!blockingOperation;

    const classes = classNames("gate-page", {disabled});

    return <div className={classes} data-stage={stage}>
      <section className="top-filler"/>
      <section className="logo">
        <img src={`static/images/logos/app-${halloween ? "halloween" : "white"}.svg`}/>
      </section>

      {this.errors()}

      <section className="crux">
        <form onSubmit={this.handleSubmit}>
          <input id="login-username" ref="username" type="text"
            placeholder={t("login.field.username")} autoFocus disabled={disabled}/>
          <input ref="password" type="password" placeholder={t("login.field.password")} disabled={disabled}/>
          <section className="actions">
            {this.renderActions()}
          </section>
        </form>
      </section>

      {this.links()}
    </div>;
  }

  errors () {
    const {t, errors, stage, halloween} = this.props;

    if (stage === "pick") {
      return <section className="errors">
        <span className="welcome-back">
          <Icon icon="heart-filled"/>
          {t("login.messages.welcome_back" + (halloween ? "-halloween" : ""))}
        </span>
      </section>;
    } else {
      return <section className="errors">
        <ErrorList errors={errors} before={<Icon icon="neutral"/>} i18nNamespace="api.login"/>
      </section>;
    }
  }

  links () {
    const {t, stage} = this.props;

    if (stage === "pick") {
      const onClick = () => {
        this.props.loginStopPicking({});
      };

      return <section className="links">
        <span className="link" onClick={onClick}>{t("login.action.show_form")}</span>
      </section>;
    } else {
      const {rememberedSessions = {}} = this.props;
      const numSavedSessions = Object.keys(rememberedSessions).length;

      return <section className="links">
        <a className="link" href={urls.accountRegister}>{t("login.action.register")}</a>
        <span>{" · "}</span>
        <a className="link" href={urls.accountForgotPassword}>{t("login.action.reset_password")}</a>
        {numSavedSessions > 0
        ? [
          <span key="separator">{" · "}</span>,
          <span key="show-saved" className="link" onClick={() => this.props.loginStartPicking({})}>
            {t("login.action.show_saved_logins")}
          </span>,
        ]
        : ""}
      </section>;
    }
  }

  renderActions () {
    const {t, blockingOperation, rememberedSessions = {}, stage, retrySetup} = this.props;

    if (stage === "pick") {
      const onLogin = (payload: ILoginWithTokenPayload) => {
        const {username} = this.refs;
        if (username) {
          (username as HTMLInputElement).value = payload.username;
        }
        this.props.loginWithToken(payload);
      };

      const onForget = this.props.forgetSessionRequest;

      return <div className="remembered-sessions">
        {map(sortBy(rememberedSessions, (x) => -x.lastConnected), (session, userId) =>
          <RememberedSession key={userId} session={session} loginWithToken={onLogin} forgetSessionRequest={onForget}/>,
        )}
      </div>;
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
      return <input type="submit" value={translatedMessage}/>;
    }
  }

  componentWillReceiveProps (nextProps: IGatePageProps) {
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

interface IGatePageProps {
  stage: string;
  errors: string[];
  blockingOperation?: ISetupOperation;
  rememberedSessions: IRememberedSessionsState;

  halloween: boolean;

  t: ILocalizer;

  loginWithPassword: typeof actions.loginWithPassword;
  loginWithToken: typeof actions.loginWithToken;
  loginStartPicking: typeof actions.loginStartPicking;
  loginStopPicking: typeof actions.loginStopPicking;
  forgetSessionRequest: typeof actions.forgetSessionRequest;
  retrySetup: typeof actions.retrySetup;
}

const mapStateToProps = (state: IState): Partial<IGatePageProps> => {
  const {rememberedSessions, session} = state;
  const {halloween} = state.status.bonuses;
  const {login} = session;

  if (!session.credentials.key) {
    const hasSessions = Object.keys(rememberedSessions).length > 0;
    const stage = (!login.blockingOperation && hasSessions && login.picking) ? "pick" : "login";
    return {...login, stage, rememberedSessions, halloween};
  } else if (!state.setup.done) {
    return {stage: "setup", ...state.setup, halloween};
  } else {
    return {stage: "ready", errors: [], blockingOperation: null, halloween};
  }
};

const mapDispatchToProps = (dispatch: IDispatch) => ({
  loginWithPassword: dispatcher(dispatch, actions.loginWithPassword),
  loginWithToken: dispatcher(dispatch, actions.loginWithToken),
  loginStartPicking: dispatcher(dispatch, actions.loginStartPicking),
  loginStopPicking: dispatcher(dispatch, actions.loginStopPicking),
  forgetSessionRequest: dispatcher(dispatch, actions.forgetSessionRequest),
  retrySetup: dispatcher(dispatch, actions.retrySetup),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GatePage);
