import * as React from "react";

interface IHoverState {
  hover: boolean;
}

export interface IHoverProps {
  hover?: boolean;
  onMouseEnter?: React.EventHandler<React.MouseEvent<any>>;
  onMouseLeave?: React.EventHandler<React.MouseEvent<any>>;
}

export default function<P extends IHoverProps>(
  WrappedComponent: React.ComponentClass<P>,
): React.ComponentClass<P> {
  return class extends React.PureComponent<P, IHoverState> {
    constructor() {
      super();
      this.state = {
        hover: false,
      };
      this.onMouseEnter = this.onMouseEnter;
      this.onMouseLeave = this.onMouseLeave;
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
        <WrappedComponent
          hover={this.state.hover}
          onMouseEnter={this.onMouseEnter}
          onMouseLeave={this.onMouseLeave}
          {...restProps}
        />
      );
    }
  };
}
