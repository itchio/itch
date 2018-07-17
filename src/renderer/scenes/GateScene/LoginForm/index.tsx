import { actions } from "common/actions";
import urls from "common/constants/urls";
import { formatError } from "common/format/errors";
import { Dispatch } from "common/types";
import React from "react";
import Button from "renderer/basics/Button";
import Icon from "renderer/basics/Icon";
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

  color: ${props => props.theme.error};
`;

class LoginForm extends React.PureComponent<Props> {
  render() {
    const { dispatch, showSaved, lastUsername } = this.props;

    return (
      <LoginFormDiv>
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
              onKeyDown={this.handleKeyDown}
            />
          </label>
          <label>
            {T(["login.field.password"])}
            <input
              id="login-password"
              ref={this.gotPasswordField}
              type="password"
              autoFocus={!!lastUsername}
              onKeyDown={this.handleKeyDown}
            />
          </label>
          <Button
            id="login-button"
            className="login-button"
            fat
            primary
            label={T(["login.action.login"])}
            onClick={this.handleSubmit}
          />
        </Form>

        <Links>
          <Link
            label={T(["login.action.register"])}
            onClick={() =>
              dispatch(
                actions.openInExternalBrowser({ url: urls.accountRegister })
              )
            }
          />
          <span>{" · "}</span>
          <Link
            label={T(["login.action.reset_password"])}
            onClick={() =>
              dispatch(
                actions.openInExternalBrowser({
                  url: urls.accountForgotPassword,
                })
              )
            }
          />
          <span key="separator">{" · "}</span>
          <Link
            key="show-saved-logins"
            label={T(["login.action.show_saved_logins"])}
            onClick={showSaved}
          />
        </Links>
      </LoginFormDiv>
    );
  }

  renderError(): JSX.Element {
    const err = this.props.error;
    if (!err) {
      return null;
    }

    return (
      <ErrorDiv>
        <div className="header">
          <Icon icon="error" />
          {T(formatError(err))}
        </div>
      </ErrorDiv>
    );
  }

  username: HTMLInputElement | null = null;
  gotUsernameField = (el: HTMLInputElement) => (this.username = el);

  password: HTMLInputElement | null = null;
  gotPasswordField = (el: HTMLInputElement) => (this.password = el);

  handleSubmit = () => {
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

  handleKeyDown = (e: React.KeyboardEvent<any>) => {
    if (e.key === "Enter") {
      this.handleSubmit();
    }
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
      color: ${props => props.theme.secondaryText};
      font-size: 90%;
    }
  }

  input {
    ${styles.heavyInput};
    font-size: ${props => props.theme.fontSizes.large};
    width: 380px;
  }

  .login-button {
    margin: 1em 0;
  }
`;

const LoginFormDiv = styled.div``;

// props

interface Props {
  showSaved: () => void;

  dispatch: Dispatch;
  lastUsername: string | null;
  error: Error | null;
}

export default hook(map => ({
  lastUsername: map(rs => rs.profile.login.lastUsername),
  error: map(rs => rs.profile.login.error),
}))(LoginForm);
