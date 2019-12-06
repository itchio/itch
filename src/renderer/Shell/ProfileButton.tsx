import { Profile } from "common/butlerd/messages";
import React from "react";
import styled from "styled-components";

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
