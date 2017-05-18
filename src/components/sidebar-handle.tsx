
import * as React from "react";
import {connect, I18nProps} from "./connect";

import * as actions from "../actions";

import {dispatcher} from "../constants/action-types";

import styled from "./styles";

const HandleDiv = styled.div`
  background: ${props => props.theme.sidebarBackground};
  height: '100%';
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: ${props => props.theme.widths.handle};

  &:hover {
    cursor: col-resize;
  }
`;

class SidebarHandle extends React.PureComponent<IProps & IDerivedProps & I18nProps, IState> {
  constructor () {
    super();
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.state = { isResizing: false };
  }

  render () {
    return <HandleDiv onMouseDown={this.handleMouseDown}/>;
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

interface IProps {}

interface IDerivedProps {
  updatePreferences: typeof actions.updatePreferences;
}

interface IState {
  isResizing: boolean;
}

export default connect<IProps>(SidebarHandle, {
  dispatch: (dispatch) => ({
    updatePreferences: dispatcher(dispatch, actions.updatePreferences),
  }),
});
