import React from "react";
import { connect, actionCreatorsList, Dispatchers } from "./connect";
import { createStructuredSelector } from "reselect";

import AllMeats from "./meats/all-meats";

let FIRST_EVER_RENDER = true;

import { ICredentials, IRootState } from "common/types";

import styled from "./styles";

const ContentContainer = styled.div`
  border-left: 1px solid ${props => props.theme.sidebarBorder};
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

  componentDidMount() {
    if (FIRST_EVER_RENDER) {
      FIRST_EVER_RENDER = false;
      this.props.firstUsefulPage({});
    }
  }
}

interface IProps {}

const actionCreators = actionCreatorsList("firstUsefulPage");

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  credentials: ICredentials;
};

export default connect<IProps>(HubContent, {
  state: createStructuredSelector({
    credentials: (rs: IRootState) => rs.profile.credentials,
  }),
  actionCreators,
});
