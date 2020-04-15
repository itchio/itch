import classNames from "classnames";
import { messages } from "common/butlerd";
import { Profile } from "common/butlerd/messages";
import { delay } from "common/delay";
import { queries } from "common/queries";
import React from "react";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { IconButton } from "renderer/basics/IconButton";
import { TimeAgo } from "renderer/basics/TimeAgo";
import { useSocket } from "renderer/contexts";
import { GateState } from "renderer/Gate";
import { animations, fontSizes } from "renderer/theme";
import { useAsyncCb } from "renderer/use-async-cb";
import styled from "styled-components";
import appWhite from "static/images/logos/app-white.svg";

const ListLogo = styled.img`
  width: 180px;
  height: auto;
  margin-bottom: 30px;
  align-self: center;
`;

const Buttons = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-self: stretch;

  padding: 2em 0;
`;

export const ListContainer = styled.div`
  animation: ${animations.fadeIn} 0.2s;

  padding: 1em;

  display: flex;
  flex-direction: column;
  align-items: stretch;

  overflow-y: auto;
`;

interface ListProps {
  setState: (state: GateState) => void;
  forgetProfile: (profile: Profile) => void;
  profiles: Profile[];
}

export const List = (props: ListProps) => {
  const socket = useSocket();
  const { setState } = props;

  const [login, loginLoading] = useAsyncCb(
    async (profile: Profile) => {
      try {
        const res = await socket.call(messages.ProfileUseSavedLogin, {
          profileId: profile.id,
        });
        await socket.query(queries.setProfile, { profile: res.profile });
      } catch (e) {
        await delay(500);

        setState({
          type: "form",
          stage: {
            type: "need-password",
            username: profile.user.username,
            error: e,
            backState: { type: "list" },
          },
        });
      }
    },
    [socket, setState]
  );

  return (
    <ListContainer>
      <ListLogo src={appWhite} />
      {props.profiles.map((profile) => (
        <Item
          disabled={loginLoading}
          key={profile.user.id}
          profile={profile}
          forgetProfile={props.forgetProfile}
          login={login}
          loginLoading={loginLoading}
        />
      ))}

      <Buttons>
        <Filler />
        <Button
          secondary
          disabled={loginLoading}
          label={<FormattedMessage id="login.action.show_form" />}
          onClick={() =>
            props.setState({ type: "form", stage: { type: "need-username" } })
          }
        />
      </Buttons>
    </ListContainer>
  );
};

const ItemDiv = styled.div`
  background: #222;
  overflow: visible;

  flex-shrink: 0;
  border-radius: 4px;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 20px 0;

  .avatar {
    width: 70px;
    height: 70px;
    margin: -5px;
    margin-right: 1em;
    border-radius: 50%;

    box-shadow: 0 0 10px #222;
  }

  p {
    padding: 2px 0;
  }

  .rest {
    padding: 6px 8px;
  }

  .filler {
    flex-grow: 8;
  }

  .username {
    color: ${(p) => p.theme.colors.text1};
    font-size: ${fontSizes.large};
    font-weight: 800;
    padding: 4px 0;
  }

  .last-connected {
    color: ${(p) => p.theme.colors.text2};
    font-size: 14px;
  }

  button {
    margin-left: 1em;
    align-self: stretch;

    border-radius: 0 2px 2px 0;

    &.icon-button {
      align-self: center;
    }
  }
`;

const Filler = styled.div`
  flex-grow: 1;
`;

interface ItemProps {
  profile: Profile;
  forgetProfile: (profile: Profile) => void;
  login: (profile: Profile) => Promise<void>;
  loginLoading: boolean;
  disabled?: boolean;
}

export const Item = (props: ItemProps) => {
  const { profile, disabled } = props;
  const coverUrl = profile.user.stillCoverUrl || profile.user.coverUrl;
  const displayName = profile.user.displayName || profile.user.username;

  return (
    <ItemDiv className={classNames("remembered-profile", { disabled })}>
      <img className="avatar" src={coverUrl} />
      <div className="rest">
        <p className="username">{displayName}</p>
        <p className="last-connected">
          <FormattedMessage id="login.remembered_session.last_connected" />{" "}
          <TimeAgo date={profile.lastConnected} />
        </p>
      </div>
      <div className="filler" />
      <span
        data-rh-at="left"
        data-rh={JSON.stringify(["prompt.forget_session.action"])}
      ></span>
      <Filler />
      <IconButton
        icon="more_vert"
        className="forget-profile"
        disabled={disabled}
        onClick={() => props.forgetProfile(profile)}
      />
      <Button
        onClick={() => !disabled && props.login(profile)}
        loading={props.loginLoading}
        disabled={disabled}
        label={<FormattedMessage id="login.action.login" />}
      ></Button>
    </ItemDiv>
  );
};
