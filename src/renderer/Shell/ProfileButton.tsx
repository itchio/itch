import classNames from "classnames";
import { Profile } from "common/butlerd/messages";
import { queries } from "common/queries";
import React, { useState } from "react";
import { useAsyncCallback } from "react-async-hook";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { MenuContents, MenuTippy } from "renderer/basics/Menu";
import { useSocket } from "renderer/contexts";
import styled from "styled-components";
import { useClickOutside } from "renderer/basics/useClickOutside";

const ProfileButtonDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0 10px;

  align-self: stretch;
  padding: 0 1em;

  cursor: pointer;

  img {
    border-radius: 50%;
    height: 2em;
    width: auto;
    margin-right: 1em;
  }
`;

interface Props {
  profile?: Profile;
  openPreferences: () => void;
}

export const ProfileButton = (props: Props) => {
  const { profile } = props;
  if (!profile) {
    return null;
  }

  const [shown, setShown] = useState(false);
  const coref = useClickOutside(() => {
    setShown(false);
  });
  const toggle = () => {
    setShown(!shown);
  };

  return (
    <MenuTippy
      content={<ProfileMenu setShown={setShown} {...props} />}
      visible={shown}
      interactive
    >
      <ProfileButtonDiv
        ref={coref("profile-button")}
        className={classNames("user-menu", { shown })}
        onClick={toggle}
      >
        <img src={profile.user.stillCoverUrl || profile.user.coverUrl} />
        {profile.user.displayName || profile.user.username}
      </ProfileButtonDiv>
    </MenuTippy>
  );
};

const ProfileMenu = (props: Props & { setShown: (shown: boolean) => void }) => {
  const socket = useSocket();

  const logout = useAsyncCallback(async () => {
    await socket.query(queries.setProfile, {});
  });

  return (
    <MenuContents>
      <Button
        label={<FormattedMessage id="sidebar.preferences" />}
        icon="cog"
        onClick={() => {
          props.setShown(false);
          props.openPreferences();
        }}
      />
      <Button
        loading={logout.loading}
        icon="exit"
        label={<FormattedMessage id="prompt.logout_action" />}
        onClick={logout.execute}
      />
    </MenuContents>
  );
};
