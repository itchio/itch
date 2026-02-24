import classNames from "classnames";
import { actions } from "common/actions";
import urls from "common/constants/urls";
import { formatError } from "common/format/errors";
import { Dispatch } from "common/types";
import React from "react";
import Button from "renderer/basics/Button";
import Icon from "renderer/basics/Icon";
import IconButton from "renderer/basics/IconButton";
import Link from "renderer/basics/Link";
import { hook } from "renderer/hocs/hook";
import { Links } from "renderer/scenes/GateScene/styles";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";

const ErrorDiv = styled.div.withConfig({
  displayName: "ErrorDiv",
})`
  width: var(--control-width);

  .header {
    text-align: center;
  }

  .icon {
    margin-right: 8px;
  }

  color: ${(props) => props.theme.error};
`;

const PasswordContainer = styled.div.withConfig({
  displayName: "PasswordContainer",
})`
  position: relative;
  width: 100%;
`;

const RevealButton = styled(IconButton).withConfig({
  displayName: "RevealButton",
})`
  position: absolute;
  right: 8px;
  top: 0;
  height: 100%;
  font-size: 20px;

  .icon {
    color: ${(props) => props.theme.ternaryText} !important;
  }

  &.passwordShown {
    .icon {
      color: ${(props) => props.theme.accent} !important;
    }
  }
`;

const ManualCodeSection = styled.div.withConfig({
  displayName: "ManualCodeSection",
})`
  width: var(--control-width);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5em;
  text-align: center;

  p {
    margin: 0;
    color: ${(props) => props.theme.secondaryText};
  }

  p.hint {
    font-size: 90%;
  }

  #manual-code {
    margin: 0;
  }
`;

const OAuthURLSection = styled.div.withConfig({
  displayName: "OAuthURLSection",
})`
  width: var(--control-width);

  details {
    summary {
      cursor: pointer;
      font-size: 90%;
      color: ${(props) => props.theme.ternaryText};
      text-align: center;
      padding: 4px 0;
      user-select: none;

      &:hover {
        color: ${(props) => props.theme.secondaryText};
      }
    }

    &[open] {
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      padding: 8px;
    }
  }

  .url-row {
    display: flex;
    align-items: center;
    gap: 0;
    margin-top: 4px;
  }

  #oauth-url {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    margin: 0;
    color: ${(props) => props.theme.secondaryText};
  }
`;

class LoginForm extends React.PureComponent<Props, State> {
  constructor(props: Props, context: any) {
    super(props, context);
    this.state = {
      passwordShown: false,
      showLegacy: false,
      oauthPending: false,
      manualCode: "",
    };
  }

  render() {
    const { dispatch, showSaved, lastUsername, oauthURL } = this.props;
    const { passwordShown, showLegacy, oauthPending, manualCode } = this.state;

    if (!showLegacy) {
      return (
        <>
          <Form onSubmit={this.handleManualCodeSubmit}>
            {this.renderError()}
            {!oauthPending && (
              <Button
                id="oauth-login-button"
                className="login-button"
                onClick={this.initiateOAuth}
                fat
                primary
                label={T(["Log in with itch.io"])}
                icon="itchio"
              />
            )}
            {oauthPending && (
              <ManualCodeSection>
                <p>{T(["A browser window has opened for login."])}</p>
                {oauthURL && (
                  <OAuthURLSection>
                    <details>
                      <summary>{T(["Browser didn't open?"])}</summary>
                      <div className="url-row">
                        <input
                          id="oauth-url"
                          type="text"
                          value={oauthURL}
                          readOnly
                          onFocus={(e) => e.target.select()}
                        />
                        <IconButton
                          icon="copy"
                          title="Copy URL"
                          onClick={this.copyOAuthURL}
                        />
                      </div>
                    </details>
                  </OAuthURLSection>
                )}
                <p className="hint">
                  {T([
                    "If the link didn't work, paste the authorization code below:",
                  ])}
                </p>
                <input
                  id="manual-code"
                  type="text"
                  value={manualCode}
                  onChange={this.handleManualCodeChange}
                  autoFocus
                />
                <Button
                  id="manual-code-submit"
                  className="login-button"
                  type="submit"
                  fat
                  primary
                  disabled={!manualCode.trim()}
                  label={T(["login.action.login"])}
                />
              </ManualCodeSection>
            )}
          </Form>

          <Links>
            {oauthPending ? (
              <Link label={T(["Cancel"])} onClick={this.cancelOAuth} />
            ) : (
              <Link
                id="show-password-login"
                label={T(["Log in with password"])}
                onClick={() => this.setState({ showLegacy: true })}
              />
            )}
            <span>{" · "}</span>
            <Link
              key="show-saved-logins"
              label={T(["login.action.show_saved_logins"])}
              onClick={showSaved}
            />
          </Links>
        </>
      );
    }

    return (
      <>
        <Form onSubmit={this.handleSubmit}>
          {this.renderError()}
          <label>
            {T(["login.field.username"])}
            <input
              id="login-username"
              ref={this.gotUsernameField}
              type="text"
              defaultValue={lastUsername}
              autoFocus={!lastUsername}
            />
          </label>
          <label>
            {T(["login.field.password"])}
            <PasswordContainer>
              <input
                id="login-password"
                ref={this.gotPasswordField}
                type={passwordShown ? "text" : "password"}
                autoFocus={!!lastUsername}
              />
              <RevealButton
                onMouseDown={this.togglePasswordReveal}
                icon={passwordShown ? "visibility" : "visibility_off"}
                hint={
                  passwordShown
                    ? ["login.action.hide_password"]
                    : ["login.action.reveal_password"]
                }
                className={classNames({ passwordShown })}
                hintPosition="top"
              />
            </PasswordContainer>
          </label>
          <Button
            id="login-button"
            className="login-button"
            type="submit"
            fat
            primary
            label={T(["login.action.login"])}
          />
        </Form>

        <Links>
          <Link
            label={T(["Go back"])}
            onClick={() => this.setState({ showLegacy: false })}
          />
          <span>{" · "}</span>
          <Link
            label={T(["login.action.register"])}
            onClick={this.openRegisterPage}
          />
          <span>{" · "}</span>
          <Link
            label={T(["login.action.reset_password"])}
            onClick={this.openPasswordResetPage}
          />
          <span key="separator">{" · "}</span>
          <Link
            key="show-saved-logins"
            label={T(["login.action.show_saved_logins"])}
            onClick={showSaved}
          />
        </Links>
      </>
    );
  }

  initiateOAuth = () => {
    const { dispatch } = this.props;
    this.setState({ oauthPending: true, manualCode: "" });
    dispatch(actions.initiateOAuthLogin({}));
  };

  handleManualCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ manualCode: e.target.value });
  };

  handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { manualCode } = this.state;
    if (!manualCode.trim()) {
      return;
    }
    const { dispatch } = this.props;
    dispatch(actions.submitOAuthCode({ code: manualCode.trim() }));
  };

  copyOAuthURL = () => {
    const { dispatch, oauthURL } = this.props;
    if (oauthURL) {
      dispatch(actions.copyToClipboard({ text: oauthURL }));
    }
  };

  cancelOAuth = () => {
    this.setState({ oauthPending: false, manualCode: "" });
  };

  openRegisterPage = () => {
    const { dispatch } = this.props;
    dispatch(actions.openInExternalBrowser({ url: urls.accountRegister }));
  };

  openPasswordResetPage = () => {
    const { dispatch } = this.props;
    dispatch(
      actions.openInExternalBrowser({
        url: urls.accountForgotPassword,
      })
    );
  };

  togglePasswordReveal = (ev: React.MouseEvent<HTMLElement>) => {
    ev.preventDefault();
    this.setState({
      passwordShown: !this.state.passwordShown,
    });
  };

  renderError(): JSX.Element {
    const err = this.props.error;
    if (!err) {
      return null;
    }

    return (
      <ErrorDiv>
        <div className="header">
          <Icon icon="error" />
          {T(formatError(err, "login"))}
        </div>
      </ErrorDiv>
    );
  }

  username: HTMLInputElement | null = null;
  gotUsernameField = (el: HTMLInputElement) => (this.username = el);

  password: HTMLInputElement | null = null;
  gotPasswordField = (el: HTMLInputElement) => (this.password = el);

  handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { username, password } = this;
    if (!username || !password) {
      return;
    }

    const { dispatch } = this.props;
    dispatch(
      actions.loginWithPassword({
        username: username.value,
        password: password.value,
      })
    );
  };
}

const Form = styled.form.withConfig({
  displayName: "Form",
})`
  --control-width: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1em;

  label {
    width: var(--control-width);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35em;

    span {
      margin: 0 4px;
      color: ${(props) => props.theme.secondaryText};
      font-size: 90%;
    }
  }

  #login-password {
    padding-right: 35px;
  }

  input {
    ${styles.heavyInput};
    font-size: ${(props) => props.theme.fontSizes.large};
    width: 100%;
  }

  .login-button {
    width: var(--control-width);
  }
`;

// props

interface Props {
  showSaved: () => void;

  dispatch: Dispatch;
  lastUsername: string | null;
  error: Error | null;
  oauthURL: string | null;
}

interface State {
  passwordShown: boolean;
  showLegacy: boolean;
  oauthPending: boolean;
  manualCode: string;
}

export default hook((map) => ({
  lastUsername: map((rs) => rs.profile.login.lastUsername),
  error: map((rs) => rs.profile.login.error),
  oauthURL: map((rs) => rs.profile.login.oauthURL),
}))(LoginForm);
