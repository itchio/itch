import { Profile } from "common/butlerd/messages";
import { RootState } from "common/types";
import React from "react";
import { connect } from "renderer/hocs/connect";
import Meats from "renderer/scenes/HubScene/Meats";
import styled from "renderer/styles";
import { createStructuredSelector } from "reselect";

const ContentContainer = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

class HubContent extends React.PureComponent<Props & DerivedProps> {
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

interface Props {}

type DerivedProps = {
  profile: Profile;
};

export default connect<Props>(
  HubContent,
  {
    state: createStructuredSelector({
      profile: (rs: RootState) => rs.profile.profile,
    }),
  }
);
