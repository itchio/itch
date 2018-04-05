import React from "react";
import classNames from "classnames";

import styled, { keyframes } from "../styles";

const turn = keyframes`
  0% { transform: rotateZ(0deg); }
  100% { transform: rotateZ(360deg); }
`;

const CircleContainer = styled.div`
  display: inline;
  margin-right: 8px;

  &.bare {
    margin-right: 0;
  }

  svg {
    width: 14px;
    height: 14px;
    margin-bottom: -2px;
    animation: ${turn} 6s infinite linear;
  }

  &.wide {
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

class LoadingCircle extends React.PureComponent<ILoadingCircleProps> {
  render() {
    const { className, progress, bare, wide } = this.props;

    return (
      <CircleContainer className={classNames(className, { bare, wide })}>
        <Circle
          percent={progress > 0 ? progress * 100.0 : 100 / 3}
          trailWidth={3}
          trailColor="#e0e0e2"
          strokeWidth={15}
          strokeColor="white"
        />
      </CircleContainer>
    );
  }
}

export default LoadingCircle;

interface ILoadingCircleProps {
  className?: string;
  progress: number;
  bare?: boolean;
  wide?: boolean;
}

// shamelessly stolen, err, adapted, from https://github.com/react-component/progress

class Circle extends React.PureComponent<ICircleProps> {
  path: SVGPathElement;
  prevTimeStamp: number;

  componentDidUpdate() {
    const now = Date.now();
    this.path.style.transitionDuration = "0.3s, 0.3s";
    if (this.prevTimeStamp && now - this.prevTimeStamp < 100) {
      this.path.style.transitionDuration = "0s, 0s";
    }
    this.prevTimeStamp = Date.now();
  }

  getPathStyles() {
    const { percent, strokeWidth, gapDegree = 0 } = this.props;
    const radius = 50 - strokeWidth / 2;
    let beginPositionX = 0;
    let beginPositionY = -radius;
    let endPositionX = 0;
    let endPositionY = -2 * radius;
    const pathString = `M 50,50 m ${beginPositionX},${beginPositionY}
     a ${radius},${radius} 0 1 1 ${endPositionX},${-endPositionY}
     a ${radius},${radius} 0 1 1 ${-endPositionX},${endPositionY}`;
    const len = Math.PI * 2 * radius;
    const trailPathStyle = {
      strokeDasharray: `${len - gapDegree}px ${len}px`,
      strokeDashoffset: `-${gapDegree / 2}px`,
      transition:
        "stroke-dashoffset .3s ease 0s, stroke-dasharray .3s ease 0s, stroke .3s",
    };
    const strokePathStyle = {
      strokeDasharray: `${percent / 100 * (len - gapDegree)}px ${len}px`,
      strokeDashoffset: `-${gapDegree / 2}px`,
      transition:
        "stroke-dashoffset .3s ease 0s, stroke-dasharray .3s ease 0s, stroke .3s",
    };
    return { pathString, trailPathStyle, strokePathStyle };
  }

  render() {
    const {
      strokeWidth,
      trailWidth,
      strokeColor,
      trailColor,
      strokeLinecap,
      style,
    } = this.props;
    const {
      pathString,
      trailPathStyle,
      strokePathStyle,
    } = this.getPathStyles();
    return (
      <svg className="circle" viewBox="0 0 100 100" style={style}>
        <path
          className={`circle-trail`}
          d={pathString}
          stroke={trailColor}
          strokeWidth={trailWidth || strokeWidth}
          fillOpacity="0"
          style={trailPathStyle}
        />
        <path
          className={`circle-path`}
          d={pathString}
          strokeLinecap={strokeLinecap}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fillOpacity="0"
          ref={path => {
            this.path = path;
          }}
          style={strokePathStyle}
        />
      </svg>
    );
  }
}

interface ICircleProps {
  percent: number;
  gapDegree?: number;
  trailWidth: number;
  trailColor: string;
  trailPathStyle?: React.CSSProperties;
  strokeWidth: number;
  strokeColor: string;
  strokeLinecap?: "inherit" | "butt" | "round" | "square";
  strokePathStyle?: React.CSSProperties;
  style?: React.CSSProperties;
}
