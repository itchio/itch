import { actions } from "common/actions";
import React from "react";
import { hook } from "renderer/hocs/hook";
import { Dispatch } from "common/types";
import styled from "renderer/styles";

const HandleDiv = styled.div`
  border-right: 1px solid ${props => props.theme.sidebarBorder};
  background: ${props => props.theme.sidebarBackground};
  height: "100%";
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: ${props => props.theme.widths.handle};

  &:hover {
    cursor: col-resize;
  }
`;

class SidebarHandle extends React.PureComponent<Props, State> {
  constructor(props: SidebarHandle["props"], context: any) {
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

    const { dispatch } = this.props;
    const width = Math.max(200, Math.min(e.clientX, 500));

    dispatch(
      actions.updatePreferences({
        sidebarWidth: width,
      })
    );
  };
}

interface Props {
  dispatch: Dispatch;
}

interface State {
  isResizing: boolean;
}

export default hook()(SidebarHandle);
