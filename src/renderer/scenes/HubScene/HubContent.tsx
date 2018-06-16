import { Credentials, IRootState } from "common/types";
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
    if (!this.props.credentials) {
      return <div />;
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
  credentials: Credentials;
};

export default connect<Props>(
  HubContent,
  {
    state: createStructuredSelector({
      credentials: (rs: IRootState) => rs.profile.credentials,
    }),
  }
);
