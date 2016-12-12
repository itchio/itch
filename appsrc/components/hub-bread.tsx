
import * as React from "react";
import {connect} from "./connect";

import * as actions from "../actions";
import urls from "../constants/urls";

import Icon from "./icon";
import HubBreadDescription from "./hub-bread-description";

import {IAction, dispatcher} from "../constants/action-types";

class HubBread extends React.Component<IHubBreadProps, void> {
  render () {
    const {navigate} = this.props;

    return <div className="hub-bread">
      <HubBreadDescription/>

      <section className="filler"/>

      <section className="icon-button" onClick={() => navigate("url/" + urls.manual)}>
        <Icon icon="lifebuoy"/>
      </section>
    </div>;
  }
}

interface IHubBreadProps {
  navigate: typeof actions.navigate;
}

const mapStateToProps = () => ({});

const mapDispatchToProps = (dispatch: (action: IAction<any>) => void) => ({
  navigate: dispatcher(dispatch, actions.navigate),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(HubBread);
