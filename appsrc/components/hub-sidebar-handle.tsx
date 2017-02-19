
import {connect} from "./connect";
import * as React from "react";
import {createStructuredSelector} from "reselect";

import * as actions from "../actions";

import {IDispatch, dispatcher} from "../constants/action-types";

class HubSidebarHandle extends React.Component<IHubSidebarHandleProps, IHubSidebarState> {

  constructor () {
    super();
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.state = { isResizing: false };
  }

  render () {
    return <div className="hub-sidebar-handle" onMouseDown={this.handleMouseDown}/>;
  }

  componentDidMount () {
    window.addEventListener("mouseup", this.handleMouseUp);
    window.addEventListener("mousemove", this.handleMouseMove);
  }

  componentWillUnmount () {
    window.removeEventListener("mouseup", this.handleMouseUp);
    window.removeEventListener("mousemove", this.handleMouseMove);
  }

  handleMouseDown (e: React.MouseEvent<any>) {
    this.setState({ isResizing: true });
  }

  handleMouseUp (e: MouseEvent) {
    this.setState({ isResizing: false });
  }

  handleMouseMove (e: MouseEvent) {
    if (!this.state.isResizing) {
      return;
    }
    e.preventDefault();

    const {updatePreferences} = this.props;
    const width = Math.max(200, Math.min(e.clientX, 500));

    updatePreferences({
      sidebarWidth: width,
    });
  }
}

interface IHubSidebarHandleProps {
  mini: boolean;

  updatePreferences: typeof actions.updatePreferences;
}

interface IHubSidebarState {
  isResizing: boolean;
}

const mapStateToProps = createStructuredSelector({});

const mapDispatchToProps = (dispatch: IDispatch) => ({
  updatePreferences: dispatcher(dispatch, actions.updatePreferences),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(HubSidebarHandle);
