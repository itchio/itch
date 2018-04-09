import React from "react";

import { T } from "renderer/t";
import urls from "common/constants/urls";
import { connect, actionCreatorsList, Dispatchers } from "../../connect";

import Link from "../../basics/link";
import Button from "../../basics/button";
import { Links } from "./links";

import styled, * as styles from "../../styles";
import { IRootState } from "common/types";

class LoginForm extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { openInExternalBrowser, showSaved, lastUsername } = this.props;

    return (
      <LoginFormDiv>
        <Form onSubmit={this.handleSubmit}>
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
            onClick={() => openInExternalBrowser({ url: urls.accountRegister })}
          />
          <span>{" · "}</span>
          <Link
            label={T(["login.action.reset_password"])}
            onClick={() =>
              openInExternalBrowser({ url: urls.accountForgotPassword })
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

  username: HTMLInputElement | null = null;
  gotUsernameField = (el: HTMLInputElement) => (this.username = el);

  password: HTMLInputElement | null = null;
  gotPasswordField = (el: HTMLInputElement) => (this.password = el);

  handleSubmit = () => {
    const { username, password } = this;
    if (!username || !password) {
      return;
    }

    this.props.loginWithPassword({
      username: username.value,
      password: password.value,
    });
  };

  handleKeyDown = e => {
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
    ${styles.heavyInput()};
    font-size: ${props => props.theme.fontSizes.large};
    width: 380px;
  }

  .login-button {
    margin: 1em 0;
  }
`;

const LoginFormDiv = styled.div``;

// props

interface IProps {
  showSaved: () => void;
}

const actionCreators = actionCreatorsList(
  "openInExternalBrowser",
  "loginWithPassword"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  lastUsername?: string;
};

export default connect<IProps>(LoginForm, {
  state: (rs: IRootState) => ({
    lastUsername: rs.profile.login.lastUsername,
  }),
  actionCreators,
});
