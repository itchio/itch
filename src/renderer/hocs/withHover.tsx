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

function withHover<ChildProps extends HoverProps>(
  Component: React.ComponentType<ChildProps>
) {
  type Props = Subtract<ChildProps, HoverProps>;
  return class extends React.PureComponent<Props, HoverState> {
    static displayName = `Hoverable(${getDisplayName(Component)})`;

    constructor(props: Props, context: any) {
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
      return (
        <Component
          {...((this.props as unknown) as ChildProps)}
          hover={this.state.hover}
          onMouseEnter={this.onMouseEnter}
          onMouseLeave={this.onMouseLeave}
        />
      );
    }
  };
}

export default withHover;
