import * as React from "react";

class HoverBoard extends React.PureComponent<void, IState> {
  childProps: any;

  constructor(props: void, context) {
    super(props, context);

    this.state = {
      hover: false,
    };
    this.childProps = {
      onMouseEnter: this.onMouseEnter,
      onMouseLeave: this.onMouseLeave,
    };
  }

  render() {
    const children = this.props.children as IChildren;
    return children({
      hover: this.state.hover,
      props: this.childProps,
    });
  }

  onMouseEnter = () => {
    this.setState({ hover: true });
  };

  onMouseLeave = () => {
    this.setState({ hover: false });
  };
}

interface IState {
  hover: boolean;
}

interface IChildProps {
  onMouseEnter: React.MouseEventHandler<any>;
  onMouseLeave: React.MouseEventHandler<any>;
}

interface IParams {
  hover: boolean;
  props: IChildProps;
}

interface IChildren {
  (params: IParams): JSX.Element;
}

export default HoverBoard;
