import React from "react";
import styled, { singleLine } from "renderer/styles";

const GameTitleDiv = styled.div`
  ${singleLine};
  max-width: 90%;
  text-align: center;
	font-weight: bold;
  font-size: ${(props) => props.theme.fontSizes.large};

  &.gt-17 {
    font-size: 14px;
  }

  &.gt-26 {
    font-size: 12px;
  }
`;

export const GameTitle = (props: { title: string }) => {
  const { title } = props;
  let className = "";
  if (title.length > 26) {
    className = "gt-26";
  } else if (title.length > 17) {
    className = "gt-17";
  }
  return <GameTitleDiv className={className}>{title}</GameTitleDiv>;
};
