import { Profile } from "common/butlerd/messages";
import { queries } from "common/queries";
import React from "react";
import { useAsyncCallback } from "react-async-hook";
import { useSocket } from "renderer/contexts";
import styled from "renderer/styles";

const ProfileButtonDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0 10px;
`;

interface Props {
  profile?: Profile;
}

export const ProfileButton = (props: Props) => {
  const socket = useSocket();
  let logout = useAsyncCallback(async () => {
    await socket.query(queries.setProfile, {});
  });

  const { profile } = props;
  if (!profile) {
    return null;
  }

  return (
    <ProfileButtonDiv style={{}}>
      {profile.user.displayName || profile.user.username}
    </ProfileButtonDiv>
  );
};
