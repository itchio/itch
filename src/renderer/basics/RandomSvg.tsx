import React from "react";
import styled from "renderer/styles";

const Triangulr = require("triangulr");

const TriDiv = styled.div`
  position: absolute;
  top: -50%;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 200%;
`;

interface Props {
  seed?: number;
}

interface Path {
  x: number;
  y: number;
  cols: number;
  lines: number;
}

class RandomSvg extends React.PureComponent<Props> {
  render() {
    let { seed, ...restProps } = this.props;

    const random = function () {
      if (!seed) {
        return Math.random();
      }
      let n = Math.sin(seed) * 10000;
      seed++;
      return n - Math.floor(n);
    };

    const greenVal = Math.round(80 + random() * 120).toString(16);
    const blueVal = Math.round(80 + random() * 120).toString(16);
    let varyVal = Math.floor(random() * 3);

    const width = 250 + random() * 80;
    const colorGenerator = function (path: Path) {
      const variance = 32;
      const ratio = (path.x * path.y) / (path.cols * path.lines);
      const code = Math.floor(
        255 - ratio * (255 - variance) - random() * variance
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

export default RandomSvg;
