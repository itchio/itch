import * as React from "react";
import styled, * as styles from "../styles";

import GifMarker from "./gif-marker";
import { IHoverProps } from "./hover-hoc";

import RandomSvg from "./random-svg";
import LoadingCircle from "./loading-circle";

const CoverDiv = styled.div`
  ${styles.defaultCoverBackground()};

  position: relative;
  padding-bottom: 79%;
  overflow: hidden;

  &:hover {
    cursor: pointer;
  }
`;

class Image extends React.PureComponent<IImageProps> {
  render() {
    const { onLoadStart, onLoadEnd, ...restProps } = this.props;
    return <img {...restProps} onLoad={onLoadEnd} />;
  }

  componentWillReceiveProps(nextProps: IImageProps) {
    if (nextProps.src !== this.props.src) {
      this.props.onLoadStart();
    }
  }
}

interface IImageProps {
  src?: string;
  onLoadStart: () => void;
  onLoadEnd: () => void;
}

const StyledImage = styled(Image)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  object-fit: cover;
`;

class Cover extends React.PureComponent<IProps, IState> {
  constructor() {
    super();
    this.state = { loading: false };
  }

  render() {
    const {
      showGifMarker = true,
      coverUrl,
      stillCoverUrl,
      hover,
      ...restProps,
    } = this.props;

    let gif: boolean;
    let url: string;

    if (coverUrl) {
      if (hover) {
        url = coverUrl;
      } else {
        if (stillCoverUrl) {
          gif = true;
          url = stillCoverUrl;
        } else {
          url = coverUrl;
        }
      }
    }

    return (
      <CoverDiv {...restProps}>
        {gif && showGifMarker ? <GifMarker /> : null}
        {url
          ? <StyledImage
              src={url}
              onLoadStart={this.onLoadStart}
              onLoadEnd={this.onLoadEnd}
            />
          : <RandomSvg />}
        {hover && this.state.loading
          ? <GifMarker label={<LoadingCircle progress={0.3} bare />} />
          : null}
      </CoverDiv>
    );
  }

  onLoadStart = () => {
    this.setState({ loading: true });
  };

  onLoadEnd = () => {
    this.setState({ loading: false });
  };
}

interface IState {
  loading: boolean;
}

export interface IProps extends IHoverProps {
  showGifMarker?: boolean;
  coverUrl: string;
  stillCoverUrl: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onContextMenu?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
}

export default Cover;
