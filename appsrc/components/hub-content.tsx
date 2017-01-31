
import * as React from "react";
import {connect} from "./connect";

import * as actions from "../actions";

import HubMeat from "./hub-meat";

let FIRST_EVER_RENDER = true;

import {IState, ICredentials} from "../types";
import {ILocalizer} from "../localizer";
import {IAction, dispatcher} from "../constants/action-types";

export class HubContent extends React.Component<IHubContentProps, void> {
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

interface IHubContentProps {
  credentials: ICredentials;

  t: ILocalizer;

  firstUsefulPage: typeof actions.firstUsefulPage;
}

const mapStateToProps = (state: IState) => ({
  credentials: state.session.credentials,
});

const mapDispatchToProps = (dispatch: (action: IAction<any>) => void) => ({
  firstUsefulPage: dispatcher(dispatch, actions.firstUsefulPage),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(HubContent);
