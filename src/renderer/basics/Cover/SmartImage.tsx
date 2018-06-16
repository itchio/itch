import React from "react";
import styled from "renderer/styles";

class Image extends React.PureComponent<Props> {
  render() {
    const { onLoadStart, onLoadEnd, ...restProps } = this.props;
    return <img {...restProps} onLoad={onLoadEnd} />;
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.src !== this.props.src) {
      this.props.onLoadStart();
    }
  }
}

interface Props {
  src?: string;
  className?: string;
  onLoadStart: () => void;
  onLoadEnd: () => void;
  onError: () => void;
}

export default styled(Image)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  object-fit: cover;

  &.error {
    visibility: hidden;
  }
`;
