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

const Ribbon = styled.div`
  width: 100%;
  position: absolute;
  top: 0;
  height: 65px;
  right: -50%;
  z-index: 4;
  text-align: center;
  background: rgba(250, 92, 92, 0.93);
  transform: rotateZ(45deg);
  font-size: 20px;
  box-shadow: 0 0 10px 1px #2f2d2d;
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
      gameId,
      ribbon,
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
        {ribbon ? <Ribbon /> : null}
        {url
          ? <StyledImage
              src={url}
              onLoadStart={this.onLoadStart}
              onLoadEnd={this.onLoadEnd}
            />
          : <RandomSvg seed={gameId} />}
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
  gameId?: number;
  ribbon?: boolean;
}

export default Cover;
