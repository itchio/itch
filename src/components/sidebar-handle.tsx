import * as React from "react";
import { connect, actionCreatorsList, Dispatchers } from "./connect";

import styled from "./styles";

const HandleDiv = styled.div`
  background: ${props => props.theme.sidebarBackground};
  height: "100%";
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: ${props => props.theme.widths.handle};

  &:hover {
    cursor: col-resize;
  }
`;

class SidebarHandle extends React.PureComponent<
  IProps & IDerivedProps,
  IState
> {
  constructor(props: SidebarHandle["props"], context) {
    super(props, context);
    this.state = { isResizing: false };
  }

  render() {
    return <HandleDiv onMouseDown={this.handleMouseDown} />;
  }

  componentDidMount() {
    window.addEventListener("mouseup", this.handleMouseUp);
    window.addEventListener("mousemove", this.handleMouseMove);
  }

  componentWillUnmount() {
    window.removeEventListener("mouseup", this.handleMouseUp);
    window.removeEventListener("mousemove", this.handleMouseMove);
  }

  handleMouseDown = (e: React.MouseEvent<any>) => {
    this.setState({ isResizing: true });
  };

  handleMouseUp = (e: MouseEvent) => {
    this.setState({ isResizing: false });
  };

  handleMouseMove = (e: MouseEvent) => {
    if (!this.state.isResizing) {
      return;
    }
    e.preventDefault();

    const { updatePreferences } = this.props;
    const width = Math.max(200, Math.min(e.clientX, 500));

    updatePreferences({
      sidebarWidth: width,
    });
  };
}

interface IProps {}

const actionCreators = actionCreatorsList("updatePreferences");

type IDerivedProps = Dispatchers<typeof actionCreators>;

interface IState {
  isResizing: boolean;
}

export default connect<IProps>(SidebarHandle, { actionCreators });
