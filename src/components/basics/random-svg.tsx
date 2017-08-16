import * as React from "react";
import styled from "../styles";

const Triangulr = require("triangulr");

const TriDiv = styled.div`
  position: absolute;
  top: -50%;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 200%;
`;

export default class RandomSvg extends React.PureComponent<any> {
  render() {
    const { ...restProps } = this.props;

    const greenVal = Math.round(80 + Math.random() * 120).toString(16);
    const blueVal = Math.round(80 + Math.random() * 120).toString(16);
    let varyVal = Math.floor(Math.random() * 3);

    const width = 250 + Math.random() * 80;
    const colorGenerator = function(path) {
      const random = 32;
      const ratio = path.x * path.y / (path.cols * path.lines);
      const code = Math.floor(
        255 - ratio * (255 - random) - Math.random() * random,
      ).toString(16);

      // + "3344" looked good
      switch (varyVal) {
        case 0:
          return `#${code}${greenVal}${blueVal}`;
        case 1:
          return `#${greenVal}${code}${blueVal}`;
        default:
          return `#${greenVal}${blueVal}${code}`;
      }
    };

    const el = new Triangulr(width, width * 0.8 * 2, 80, 40, colorGenerator);
    return (
      <TriDiv
        dangerouslySetInnerHTML={{ __html: el.outerHTML }}
        {...restProps}
      />
    );
  }
}
