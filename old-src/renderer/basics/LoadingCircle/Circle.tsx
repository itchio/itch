import React from "react";

// shamelessly stolen, err, adapted, from https://github.com/react-component/progress

interface CircleProps {
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

export const Circle = (props: CircleProps) => {
  let getPathStyles = () => {
    const { percent, strokeWidth, gapDegree = 0 } = props;
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
    };
    const strokePathStyle = {
      strokeDasharray: `${(percent / 100) * (len - gapDegree)}px ${len}px`,
      strokeDashoffset: `-${gapDegree / 2}px`,
    };
    return { pathString, trailPathStyle, strokePathStyle };
  };

  const {
    strokeWidth,
    trailWidth,
    strokeColor,
    trailColor,
    strokeLinecap,
    style,
  } = props;
  const { pathString, trailPathStyle, strokePathStyle } = getPathStyles();
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
        style={strokePathStyle}
      />
    </svg>
  );
};
