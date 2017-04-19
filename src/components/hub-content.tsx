
import * as React from "react";
import {connect, I18nProps} from "./connect";

import * as actions from "../actions";

import HubMeat from "./hub-meat";

let FIRST_EVER_RENDER = true;

import {ICredentials} from "../types";
import {dispatcher} from "../constants/action-types";

export class HubContent extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    if (!this.props.credentials) {
      return <div/>;
    }

    return <div className="hub-content">
      <HubMeat/>
    </div>;
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
  state: (state) => ({
    credentials: state.session.credentials,
  }),
  dispatch: (dispatch) => ({
    firstUsefulPage: dispatcher(dispatch, actions.firstUsefulPage),
  }),
});
