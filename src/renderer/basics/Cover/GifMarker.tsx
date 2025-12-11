import React from "react";
import styled from "renderer/styles";

interface Props {
  label?: string | JSX.Element | JSX.Element[];
}

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

const GifMarker = ({ label = "GIF" }: Props) => {
  return <GifMarkerSpan>{label}</GifMarkerSpan>;
};

export default React.memo(GifMarker);
