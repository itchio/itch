import React from "react";
import styled from "renderer/styles";

const GifMarkerSpan = styled.span`
  position: absolute;
  top: 5px;
  left: 5px;
  background: #333333;
  color: rgba(253, 253, 253, 0.74);
  font-size: 12px;
  padding: 4px;
  border-radius: 2px;
  font-weight: bold;
  opacity: 0.8;
  z-index: 2;

  transition: all 0.2s;
`;

class GifMarker extends React.PureComponent<Props> {
  render() {
    const { label = "GIF" } = this.props;
    return <GifMarkerSpan>{label}</GifMarkerSpan>;
  }
}

interface Props {
  label?: string | JSX.Element | JSX.Element[];
}

export default GifMarker;
