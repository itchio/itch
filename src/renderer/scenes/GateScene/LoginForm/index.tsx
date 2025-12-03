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

const ErrorDiv = styled.div`
  min-width: 500px;
  margin: 1.4em 0;

  .header {
    text-align: center;
  }

  .icon {
    margin-right: 8px;
  }

  color: ${(props) => props.theme.error};
`;

const PasswordContainer = styled.div`
  position: relative;
`;

const RevealButton = styled(IconButton)`
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

class LoginForm extends React.PureComponent<Props, State> {
  constructor(props: Props, context: any) {
    super(props, context);
    this.state = {
      passwordShown: false,
      showLegacy: false,
    };
  }

  render() {
    const { dispatch, showSaved, lastUsername } = this.props;
    const { passwordShown, showLegacy } = this.state;

    if (!showLegacy) {
      return (
        <>
          <Form>
            {this.renderError()}
            <Button
              id="oauth-login-button"
              className="login-button"
              onClick={this.initiateOAuth}
              fat
              primary
              label={T(["Log in with itch.io"])}
              icon="itchio"
            />
          </Form>

          <Links>
            <Link
              label={T(["Log in with password"])}
              onClick={() => this.setState({ showLegacy: true })}
            />
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
    dispatch(actions.initiateOAuthLogin({}));
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

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;

  label {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin: 0.5em 1em;

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
    width: 380px;
  }

  .login-button {
    margin: 1em 0;
  }
`;

// props

interface Props {
  showSaved: () => void;

  dispatch: Dispatch;
  lastUsername: string | null;
  error: Error | null;
}

interface State {
  passwordShown: boolean;
  showLegacy: boolean;
}

export default hook((map) => ({
  lastUsername: map((rs) => rs.profile.login.lastUsername),
  error: map((rs) => rs.profile.login.error),
}))(LoginForm);
