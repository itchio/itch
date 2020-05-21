import classNames from "classnames";
import { messages } from "common/butlerd";
import { ProfileRequestTOTPResult } from "@itchio/valet/messages";
import { delay } from "common/delay";
import { queries } from "common/queries";
import React, { useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { ErrorState } from "renderer/basics/ErrorState";
import { IconButton } from "renderer/basics/IconButton";
import { Modal } from "renderer/basics/Modal";
import { LargeTextInput } from "renderer/basics/TextInput";
import { useSocket } from "renderer/contexts";
import { Deferred } from "renderer/deferred";
import { GateState } from "renderer/Gate";
import { animations, fontSizes } from "renderer/theme";
import { useAsyncCb } from "renderer/use-async-cb";
import styled from "styled-components";

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
  font-size: ${fontSizes.large};
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

const FormErrorState = styled(ErrorState)`
  margin-top: 0;
  margin-bottom: 0;

  &.shown {
    margin-top: 2em;
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

  display: flex;
  flex-direction: row;
  justify-content: stretch;
`;

const RevealButton = styled(IconButton)`
  position: absolute;
  right: 8px;
  top: 0;
  height: 100%;
  font-size: 20px;

  .icon {
    color: ${(p) => p.theme.colors.text3} !important;
  }

  &.passwordShown {
    .icon {
      color: ${(p) => p.theme.colors.text2} !important;
    }
  }
`;

const SegmentedGroup = styled.div`
  display: flex;
  flex-direction: row;
  align-self: stretch;
  align-items: stretch;
  justify-content: stretch;

  *:first-child {
    flex-grow: 1;

    border-radius: 4px 0 0 4px;
    border-right: none !important;
  }

  *:last-child {
    border-radius: 0 4px 4px 0;
    border-left: none !important;
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

  const [openRegisterPage] = useAsyncCb(async () => {
    await socket.query(queries.openExternalURL, {
      url: "https://itch.io/register",
    });
  }, [socket]);

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
          onClick={openRegisterPage}
        />
      </Buttons>
      <Label>
        <FormattedMessage id="login.field.username" />
      </Label>
      <SegmentedGroup>
        <LargeTextInput
          id="login-username"
          ref={usernameRef}
          autoFocus
          onKeyPress={(ev) => {
            setUsername(ev.currentTarget.value);
            if (ev.key === "Enter") {
              onNext();
            }
          }}
          onChange={(ev) => setUsername(ev.currentTarget.value)}
        />
        <Button
          id="login-next"
          disabled={username == ""}
          secondary={username == ""}
          onClick={onNext}
          label={<FormattedMessage id="prompt.action.next" />}
        />
      </SegmentedGroup>
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

  let [onForgotPassword] = useAsyncCb(async () => {
    await socket.query(queries.openExternalURL, {
      url: "https://itch.io/user/forgot-password",
    });
  }, [socket]);

  const { setState, stage: propsStage } = props;

  let [onLogin, onLoginLoading, onLoginError] = useAsyncCb(async () => {
    const { error: _, ...stage } = propsStage;
    setState({
      type: "form",
      stage,
    });

    if (!passwordRef.current) {
      return;
    }

    if (stage.username === "#api-key") {
      // for integration tests
      const { profile } = await socket.call(messages.ProfileLoginWithAPIKey, {
        apiKey: passwordRef.current.value,
      });

      await socket.query(queries.setProfile, { profile });

      return;
    }

    let cancelled = false;
    try {
      const { profile, cookie } = await socket.call(
        messages.ProfileLoginWithPassword,
        {
          username: stage.username,
          password: passwordRef.current.value,
        },
        (convo) => {
          convo.onRequest(messages.ProfileRequestTOTP, async (params) => {
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

          convo.onRequest(messages.ProfileRequestCaptcha, async (params) => {
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
  }, [socket, propsStage, setState]);

  const error = onLoginError || props.stage.error;

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
          onClick={onForgotPassword}
        />
      </Buttons>
      <Label>
        <FormattedMessage
          id="login.field.password_for"
          values={{ username: props.stage.username }}
        />
      </Label>
      <SegmentedGroup>
        <PasswordContainer className="input-wrapper">
          <LargeTextInput
            id="login-password"
            type={passwordShown ? "text" : "password"}
            disabled={onLoginLoading}
            ref={passwordRef}
            autoFocus
            onKeyPress={(ev) => {
              setPassword(ev.currentTarget.value);
              if (ev.key === "Enter") {
                onLogin();
              }
            }}
            onChange={(ev) => setPassword(ev.currentTarget.value)}
          />
          <RevealButton
            onMouseDown={togglePasswordVisibility}
            icon={passwordShown ? "visibility" : "visibility_off"}
            className={classNames({ passwordShown })}
          />
        </PasswordContainer>
        <Button
          id="login-proceed"
          disabled={password == ""}
          secondary={password == ""}
          loading={onLoginLoading}
          onClick={onLogin}
          label={<FormattedMessage id="login.action.login" />}
        />
      </SegmentedGroup>
      <FormErrorState error={error} />
      {totpState ? <TOTPModal state={totpState} /> : null}
    </FormContainer>
  );
};

const TOTPModal = (props: { state: TOTPState }) => {
  const { state } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  const [login, loginLoading] = useAsyncCb(async () => {
    if (!inputRef.current) {
      return;
    }

    state.resolve({
      code: inputRef.current.value,
    });
  }, [inputRef, state]);

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
          onKeyPress={(ev) => {
            if (ev.key === "Enter") {
              login();
            }
          }}
        />
      </Label>
      <Buttons>
        <Button
          loading={loginLoading}
          label={<FormattedMessage id="login.action.login" />}
          onClick={login}
        />
        <Filler />
      </Buttons>
    </Modal>
  );
};
