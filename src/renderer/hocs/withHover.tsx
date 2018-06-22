import React from "react";
import getDisplayName from "renderer/helpers/getDisplayName";
import { Subtract } from "common/types";

interface HoverState {
  hover: boolean;
}

export interface HoverProps {
  hover: boolean;
  onMouseEnter?: React.EventHandler<React.MouseEvent<any>>;
  onMouseLeave?: React.EventHandler<React.MouseEvent<any>>;
}

function withHover<P extends HoverProps>(
  Component: React.ComponentType<P>
): React.ComponentType<Subtract<P, HoverProps>> {
  return class extends React.PureComponent<
    Subtract<P, HoverProps>,
    HoverState
  > {
    static displayName = `Hoverable(${getDisplayName(Component)})`;

    constructor(props: Subtract<P, HoverProps>, context: any) {
      super(props, context);
      this.state = {
        hover: false,
      };
    }

    onMouseEnter = () => {
      this.setState({ hover: true });
    };

    onMouseLeave = () => {
      this.setState({ hover: false });
    };

    render() {
      const restProps = this.props;
      return (
        <Component
          hover={this.state.hover}
          onMouseEnter={this.onMouseEnter}
          onMouseLeave={this.onMouseLeave}
          {...restProps}
        />
      );
    }
  };
}

export default withHover;
