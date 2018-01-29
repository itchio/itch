import * as React from "react";
import { connect } from "./connect";
import { createStructuredSelector } from "reselect";

import { actions, dispatcher } from "../actions";

import AllMeats from "./meats/all-meats";

let FIRST_EVER_RENDER = true;

import { ICredentials } from "../types";

import styled from "./styles";

const ContentContainer = styled.div`
  border-left: 1px solid ${props => props.theme.sidebarBorder};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

export class HubContent extends React.PureComponent<IProps & IDerivedProps> {
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

interface IDerivedProps {
  credentials: ICredentials;

  firstUsefulPage: typeof actions.firstUsefulPage;
}

export default connect<IProps>(HubContent, {
  state: createStructuredSelector({
    credentials: state => state.session.credentials,
  }),
  dispatch: dispatch => ({
    firstUsefulPage: dispatcher(dispatch, actions.firstUsefulPage),
  }),
});
