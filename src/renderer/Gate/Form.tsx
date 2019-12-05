import classNames from "classnames";
import { messages } from "common/butlerd";
import { ProfileRequestTOTPResult } from "common/butlerd/messages";
import { delay } from "common/delay";
import { queries } from "common/queries";
import React, { useRef, useState } from "react";
import { useAsyncCallback } from "react-async-hook";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { ErrorState } from "renderer/basics/ErrorState";
import { IconButton } from "renderer/basics/IconButton";
import { Modal } from "renderer/basics/Modal";
import { LargeTextInput } from "renderer/basics/TextInput";
import { Deferred } from "renderer/deferred";
import { GateState } from "renderer/Gate";
import styled, { animations } from "renderer/styles";
import { useSocket } from "renderer/contexts";

export type FormStage = NeedUsername | NeedPassword | NeedTOTP | NeedCaptcha;

export interface NeedUsername {
  type: "need-username";
}

export interface NeedPassword {
  type: "need-password";
  username: string;
  error?: Error;

  backState: GateState;
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

const FormErrorState = styled(ErrorState)`
  margin-bottom: 0;
  &.shown {
    margin-bottom: 2em;
  }

  .header {
    text-align: center;
  }

  .icon {
    margin-right: 8px;
  }
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
  switch (props.stage.type) {
    case "need-username":
      // n.b: TypeScript doesn't understand what we're doing here, ah well.
      return <FormNeedUsername {...(props as FormProps<NeedUsername>)} />;
    case "need-password":
      return <FormNeedPassword {...(props as FormProps<NeedPassword>)} />;
    default:
      return <div>TODO: stage {props.stage.type}</div>;
  }
};

const FormNeedUsername = (props: FormProps<NeedUsername>) => {
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
          backState: {
            type: "form",
            stage: props.stage,
          },
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

type TOTPState = Deferred<ProfileRequestTOTPResult, void>;

const FormNeedPassword = (props: FormProps<NeedPassword>) => {
  const socket = useSocket();
  const passwordRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [passwordShown, setPasswordShown] = useState(false);
  const [totpState, setTOTPState] = useState<TOTPState | null>(null);

  let togglePasswordVisibility = () => {
    setPasswordShown(!passwordShown);
  };

  let onForgotPassword = useAsyncCallback(async () => {
    await socket.query(queries.openExternalURL, {
      url: "https://itch.io/user/forgot-password",
    });
  });

  let onLogin = useAsyncCallback(async () => {
    const { error: _, ...stage } = props.stage;
    props.setState({
      type: "form",
      stage,
    });

    if (!passwordRef.current) {
      return;
    }

    let cancelled = false;
    try {
      const { profile, cookie } = await socket.call(
        messages.ProfileLoginWithPassword,
        {
          username: props.stage.username,
          password: passwordRef.current.value,
        },
        convo => {
          convo.onRequest(messages.ProfileRequestTOTP, async params => {
            console.log(`Doing TOTP...`);
            try {
              return await new Promise((resolve, reject) => {
                setTOTPState({ resolve, reject });
              });
            } catch (e) {
              cancelled = true;
              throw new Error("cancelled at TOTP stage");
            } finally {
              setTOTPState(null);
            }
          });

          convo.onRequest(messages.ProfileRequestCaptcha, async params => {
            console.log(`Doing Captcha...`);
            return { recaptchaResponse: "wrong" };
          });
        }
      );
      await socket.query(queries.setProfile, { profile, cookie });
    } catch (e) {
      if (cancelled) {
        return;
      }

      await delay(500);
      throw e;
    }
  });

  const error = onLogin.error || props.stage.error;

  return (
    <FormContainer>
      <Buttons>
        <Button
          secondary
          icon="arrow-left"
          label={<FormattedMessage id="prompt.action.back" />}
          onClick={() => props.setState(props.stage.backState)}
        />
        <Filler />
        <Button
          secondary
          label={<FormattedMessage id="login.action.reset_password" />}
          onClick={onForgotPassword.execute}
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
      <FormErrorState error={error} />
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
      {totpState ? <TOTPModal state={totpState} /> : null}
    </FormContainer>
  );
};

const TOTPModal = (props: { state: TOTPState }) => {
  const { state } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  const login = useAsyncCallback(async () => {
    if (!inputRef.current) {
      return;
    }

    state.resolve({
      code: inputRef.current.value,
    });
  });

  return (
    <Modal
      title={<FormattedMessage id="login.two_factor.title" />}
      onClose={() => state.reject()}
    >
      <p>
        <FormattedMessage id="login.two_factor.enter_code" />
      </p>
      <Label>
        <span>
          <FormattedMessage id="login.two_factor.verification_code_label" />
        </span>
        <LargeTextInput
          ref={inputRef}
          autoFocus
          onKeyPress={ev => {
            if (ev.key === "Enter") {
              login.execute();
            }
          }}
        />
      </Label>
      <Buttons>
        <Button
          loading={login.loading}
          label={<FormattedMessage id="login.action.login" />}
          onClick={login.execute}
        />
        <Filler />
      </Buttons>
    </Modal>
  );
};
