
import * as React from "react";
import styled from "../styles";

const GifMarkerSpan = styled.span`
  position: absolute;
  top: 5px;
  right: 5px;
  background: #333333;
  color: rgba(253, 253, 253, 0.74);
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 2px;
  font-weight: bold;
  opacity: .8;
`;

class GifMarker extends React.PureComponent<{}, void> {
  render() {
    return <GifMarkerSpan>GIF</GifMarkerSpan>;
  }
}

export default GifMarker;
