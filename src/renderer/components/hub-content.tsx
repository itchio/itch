import React from "react";
import { connect } from "./connect";
import { createStructuredSelector } from "reselect";

import AllMeats from "./meats/all-meats";

import { ICredentials, IRootState } from "common/types";

import styled from "./styles";

const ContentContainer = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

class HubContent extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    if (!this.props.credentials) {
      return <div />;
    }

    return (
      <ContentContainer>
        <AllMeats />
      </ContentContainer>
    );
  }
}

interface IProps {}

type IDerivedProps = {
  credentials: ICredentials;
};

export default connect<IProps>(HubContent, {
  state: createStructuredSelector({
    credentials: (rs: IRootState) => rs.profile.credentials,
  }),
});
