import classNames from "classnames";
import { messages } from "common/butlerd";
import { Profile } from "common/butlerd/messages";
import { delay } from "common/delay";
import { queries } from "common/queries";
import React from "react";
import { useAsyncCallback, UseAsyncReturn } from "react-async-hook";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { IconButton } from "renderer/basics/IconButton";
import { TimeAgo } from "renderer/basics/TimeAgo";
import { GateState } from "renderer/Gate";
import { useSocket } from "renderer/Route";
import styled from "styled-components";
import { animations, boxy } from "renderer/styles";

const Buttons = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-self: stretch;

  padding: 2em 0;
`;

export const ListContainer = styled.div`
  animation: ${animations.fadeIn} 0.2s;

  padding: 1em 0;

  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow-y: auto;
`;

interface ListProps {
  setState: (state: GateState) => void;
  forgetProfile: (profileId: number) => void;
  profiles: Profile[];
}

export const List = (props: ListProps) => {
  const socket = useSocket();

  const login = useAsyncCallback(async (profile: Profile) => {
    try {
      const res = await socket.call(messages.ProfileUseSavedLogin, {
        profileId: profile.id,
      });
      await socket.query(queries.setProfile, { profile: res.profile });
    } catch (e) {
      await delay(500);

      props.setState({
        type: "form",
        stage: {
          type: "need-password",
          username: profile.user.username,
          error: e,
          backState: { type: "list" },
        },
      });
    }
  });

  const loading = login.loading;

  return (
    <ListContainer>
      {props.profiles.map(profile => (
        <Item
          disabled={loading}
          key={profile.user.id}
          profile={profile}
          forgetProfile={props.forgetProfile}
          login={login}
        />
      ))}

      <Buttons>
        <Button
          secondary
          disabled={loading}
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
  ${boxy}

  flex-shrink: 0;
  border-radius: 2px;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 8px 4px;
  padding-right: 1em;

  .avatar {
    filter: grayscale(100%);

    width: 72px;
    height: 72px;
    border-radius: 2px;
    margin-right: 1em;
  }

  &:hover .avatar {
    filter: grayscale(0%);
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
    color: ${props => props.theme.baseText};
    font-size: ${props => props.theme.fontSizes.huge};
    font-weight: bold;
    padding: 4px 0;
  }

  .last-connected {
    color: ${props => props.theme.secondaryText};
    font-size: 14px;
  }

  box-shadow: 0 0 4px ${props => props.theme.sidebarBackground};

  &:active {
    filter: brightness(70%);
  }

  button {
    margin-left: 1em;
  }
`;

const Filler = styled.div`
  flex-grow: 1;
`;

interface ItemProps {
  profile: Profile;
  forgetProfile: (profileId: number) => void;
  login: UseAsyncReturn<void, [Profile]>;
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
        icon="cross"
        className="forget-profile"
        disabled={disabled}
        onClick={() => props.forgetProfile(profile.id)}
      />
      <Button
        onClick={() => !disabled && props.login.execute(profile)}
        loading={props.login.loading}
        disabled={disabled}
        label={<FormattedMessage id="login.action.login" />}
      ></Button>
    </ItemDiv>
  );
};
