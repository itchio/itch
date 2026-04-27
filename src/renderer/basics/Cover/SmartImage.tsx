import React from "react";
import styled from "renderer/styles";

class Image extends React.PureComponent<Props> {
  override render() {
    const { onLoadStart, onLoadEnd, ...restProps } = this.props;
    return <img {...restProps} onLoad={onLoadEnd} />;
  }

  override componentDidMount() {
    this.props.onLoadStart();
  }

  override componentDidUpdate(props: Props, state: any, snapshot: Props) {
    if (snapshot && snapshot.src !== props.src) {
      this.props.onLoadStart();
    }
  }

  override getSnapshotBeforeUpdate(prevProps: Props): Props {
    if (prevProps.src !== this.props.src) {
      return prevProps;
    }
    return null;
  }
}

interface Props {
  src?: string;
  alt?: string;
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
