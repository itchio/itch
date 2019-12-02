import React, { useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { LargeTextInput } from "renderer/basics/TextInput";
import { GateState } from "renderer/Gate";
import styled, { animations } from "renderer/styles";
import { useAsyncCallback } from "react-async-hook";
import { useSocket } from "renderer/Route";
import { queries } from "common/queries";
import { IconButton } from "renderer/basics/IconButton";
import classNames from "classnames";
import { ProfileForget } from "common/butlerd/messages";
import { LoadingCircle } from "renderer/basics/LoadingCircle";
import { messages } from "common/butlerd";
import dump from "common/util/dump";
import { ErrorState } from "renderer/basics/ErrorState";

export type FormStage = NeedUsername | NeedPassword | NeedTOTP | NeedCaptcha;

export interface NeedUsername {
  type: "need-username";
}

export interface NeedPassword {
  type: "need-password";
  username: string;
}

export interface NeedTOTP {
  type: "need-totp";
}

export interface NeedCaptcha {
  type: "need-totp";
}

export interface FormProps<T> {
  stage: T;
  hasSavedProfiles: boolean;
  setState: (state: GateState) => void;
}

const FormContainer = styled.div`
  animation: ease-out ${animations.fadeIn} 0.1s;

  display: flex;
  flex-direction: column;

  width: 600px;

  align-self: center;
  align-items: flex-start;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  margin-top: 2em;
  margin-bottom: 1em;
  font-size: ${props => props.theme.fontSizes.larger};
  align-self: stretch;

  input,
  .input-wrapper {
    align-self: stretch;
    width: 100%;
    margin: 1em 0;
  }
`;

const Buttons = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-self: stretch;

  button {
    margin-right: 1em;

    &:last-of-type {
      margin-right: 0;
    }
  }
`;

const Filler = styled.div`
  flex-grow: 1;
`;

const Username = styled.div`
  margin: 0.5em 0;
  font-size: ${props => props.theme.fontSizes.large};
  color: ${props => props.theme.secondaryText};
`;

const ErrorDiv = styled.div`
  margin-bottom: 2em;

  .header {
    text-align: center;
  }

  .icon {
    margin-right: 8px;
  }

  color: ${props => props.theme.error};
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
    color: ${props => props.theme.ternaryText} !important;
  }

  &.passwordShown {
    .icon {
      color: ${props => props.theme.accent} !important;
    }
  }
`;

export const Form = (props: FormProps<FormStage>) => {
  const { stage, setState } = props;
  switch (stage.type) {
    case "need-username":
      // n.b: TypeScript doesn't understand what we're doing here, ah well.
      return <FormNeedUsername {...(props as FormProps<NeedUsername>)} />;
    case "need-password":
      return <FormNeedPassword {...(props as FormProps<NeedPassword>)} />;
    default:
      return <div>TODO: stage {props.stage.type}</div>;
  }
};

export const FormNeedUsername = (props: FormProps<NeedUsername>) => {
  const socket = useSocket();
  const usernameRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState("");

  const openRegisterPage = useAsyncCallback(async () => {
    await socket.query(queries.openExternalURL, {
      url: "https://itch.io/register",
    });
  });

  let onNext = () => {
    if (usernameRef.current) {
      props.setState({
        type: "form",
        stage: {
          type: "need-password",
          username: usernameRef.current.value,
        },
      });
    }
  };

  return (
    <FormContainer>
      <Buttons>
        {props.hasSavedProfiles && (
          <Button
            secondary
            icon="list"
            label={<FormattedMessage id="login.action.show_saved_logins" />}
            onClick={() => props.setState({ type: "list" })}
          />
        )}
        <Filler />
        <Button
          secondary
          label={<FormattedMessage id="login.action.register" />}
          onClick={openRegisterPage.execute}
        />
      </Buttons>
      <Label>
        <FormattedMessage id="login.field.username" />
        <LargeTextInput
          ref={usernameRef}
          autoFocus
          onKeyPress={ev => {
            setUsername(ev.currentTarget.value);
            if (ev.key === "Enter") {
              onNext();
            }
          }}
          onChange={ev => setUsername(ev.currentTarget.value)}
        />
      </Label>
      <Buttons>
        <Button
          disabled={username == ""}
          onClick={onNext}
          label={<FormattedMessage id="prompt.action.next" />}
        />
      </Buttons>
    </FormContainer>
  );
};

export const FormNeedPassword = (props: FormProps<NeedPassword>) => {
  const socket = useSocket();
  const passwordRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [passwordShown, setPasswordShown] = useState(false);

  let togglePasswordVisibility = () => {
    setPasswordShown(!passwordShown);
  };

  let onForget = useAsyncCallback(async () => {
    await socket.query(queries.openExternalURL, {
      url: "https://itch.io/user/forgot-password",
    });
  });

  let onLogin = useAsyncCallback(async () => {
    if (!passwordRef.current) {
      return;
    }

    await socket.call(messages.ProfileLoginWithPassword, {
      username: props.stage.username,
      password: passwordRef.current.value,
    });
  });

  return (
    <FormContainer>
      <Buttons>
        <Button
          secondary
          icon="arrow-left"
          label={<FormattedMessage id="prompt.action.back" />}
          onClick={() =>
            props.setState({
              type: "form",
              stage: {
                type: "need-username",
              },
            })
          }
        />
        <Filler />
        <Button
          secondary
          label={<FormattedMessage id="login.action.reset_password" />}
          onClick={onForget.execute}
        />
      </Buttons>
      <Label>
        <FormattedMessage id="login.field.password" />

        <PasswordContainer className="input-wrapper">
          <RevealButton
            onMouseDown={togglePasswordVisibility}
            icon={passwordShown ? "visibility" : "visibility_off"}
            hint={
              passwordShown
                ? ["login.action.hide_password"]
                : ["login.action.reveal_password"]
            }
            className={classNames({ passwordShown })}
            hintPosition="top"
          />
          <LargeTextInput
            type={passwordShown ? "text" : "password"}
            disabled={onLogin.loading}
            ref={passwordRef}
            autoFocus
            onKeyPress={ev => {
              setPassword(ev.currentTarget.value);
              if (ev.key === "Enter") {
                onLogin.execute();
              }
            }}
            onChange={ev => setPassword(ev.currentTarget.value)}
          />
        </PasswordContainer>
      </Label>
      {onLogin.error ? (
        <ErrorDiv>
          <ErrorState error={onLogin.error} />
        </ErrorDiv>
      ) : null}
      <Buttons>
        <Username>
          <FormattedMessage
            id="login.two_factor.as_user"
            values={{ username: props.stage.username }}
          />
        </Username>
        <Filler />
        <Button
          disabled={password == ""}
          loading={onLogin.loading}
          onClick={onLogin.execute}
          label={<FormattedMessage id="login.action.login" />}
        />
      </Buttons>
    </FormContainer>
  );
};
