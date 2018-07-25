import React from "react";
import styled from "renderer/styles";
import ContainerDimensions from "react-container-dimensions";

const ChartWrapper = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  pointer-events: none;
`;

class ChartGradient extends React.PureComponent<{}> {
  render() {
    return (
      <linearGradient id="downloadGradient" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="rgb(158, 150, 131)" stopOpacity="0.2" />
        <stop offset="50%" stopColor="rgb(158, 150, 131)" stopOpacity="0.2" />
        <stop offset="100%" stopColor="rgb(158, 150, 131)" stopOpacity="0.1" />
      </linearGradient>
    );
  }
}

class Chart extends React.PureComponent<Props> {
  render() {
    return (
      <ChartWrapper>
        <ContainerDimensions>{this.renderContent}</ContainerDimensions>
      </ChartWrapper>
    );
  }

  renderContent = ({ width, height }: { width: number; height: number }) => {
    const { data } = this.props;
    let clipPathId = "clipPath" + Date.now();

    let max = 10; // enforce a minimum so we don't get NaNs
    for (const point of data) {
      if (point > max) {
        max = point;
      }
    }
    max *= 1.1;

    const xs = width! / (data.length - 1);
    const ys = height! / max;

    let pathString = `M0,${height}`;
    for (let x = 0; x < data.length; x++) {
      let y = data[x];
      pathString += `L${x * xs},${height! - y * ys}`;
    }
    pathString += `L${data.length * xs},${height}`;
    pathString += `L0,${height}`;
    pathString += "Z";

    return (
      <svg
        width={width}
        height={height}
        version="1.1"
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <clipPath id={clipPathId}>
            <rect width={width} height={height} x={0} y={0} />
          </clipPath>
          <ChartGradient />
        </defs>
        <g clipPath={`#${clipPathId}`}>
          <path
            d={pathString}
            fill="url(#downloadGradient)"
            height={height}
            width={width}
            stroke="none"
          />
        </g>
      </svg>
    );
  };
}

interface Props {
  data: number[];
}

export default Chart;
