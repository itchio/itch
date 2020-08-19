import { Profile } from "common/butlerd/messages";
import React from "react";
import { hook } from "renderer/hocs/hook";
import Meats from "renderer/scenes/HubScene/Meats";
import styled from "renderer/styles";

const ContentContainer = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

class HubContent extends React.PureComponent<Props> {
  render() {
    const { profile } = this.props;
    if (!profile) {
      return null;
    }

    return (
      <ContentContainer>
        <Meats />
      </ContentContainer>
    );
  }
}

interface Props {
  profile: Profile;
}

export default hook((map) => ({
  profile: map((rs) => rs.profile.profile),
}))(HubContent);
