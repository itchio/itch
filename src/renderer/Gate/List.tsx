import { messages } from "common/butlerd";
import { Profile } from "common/butlerd/messages";
import { queries } from "common/queries";
import React from "react";
import { useAsyncCallback, UseAsyncReturn } from "react-async-hook";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { IconButton } from "renderer/basics/IconButton";
import { TimeAgo } from "renderer/basics/TimeAgo";
import { GateState } from "renderer/Gate";
import { ListContainer } from "renderer/Gate/ListContainer";
import { useSocket } from "renderer/Route";
import { boxy } from "renderer/styles";
import styled from "styled-components";
import classNames from "classnames";
import { delay } from "common/delay";

const Buttons = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-self: stretch;

  padding: 2em 0;
`;

interface ListProps {
  setState: (state: GateState) => void;
  profiles: Profile[];
}

export const List = (props: ListProps) => {
  const socket = useSocket();
  const forgetProfile = useAsyncCallback(async (profileId: number) => {
    // TODO: add confirmation first
    socket.call(messages.ProfileForget, { profileId });
  });

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
          forgetProfile={forgetProfile.execute}
          login={login}
        />
      ))}

      <Buttons>
        <Button
          secondary
          loading={loading}
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
  ${boxy};
  flex-shrink: 0;
  min-width: 380px;
  border-radius: 2px;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 8px 4px;

  &.disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  .avatar {
    filter: grayscale(100%);

    width: 64px;
    height: 64px;
    border-radius: 2px;
    margin-right: 4px;
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

  &:hover {
    box-shadow: 0 0 8px ${props => props.theme.sidebarBackground};
    cursor: pointer;
  }

  &:active {
    filter: brightness(70%);
  }
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
    <ItemDiv
      className={classNames("remembered-profile", { disabled })}
      onClick={() => !disabled && props.login.execute(profile)}
    >
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
      >
        <IconButton
          icon="cross"
          className="forget-profile"
          onClick={() => props.forgetProfile(profile.id)}
        />
      </span>
    </ItemDiv>
  );
};
