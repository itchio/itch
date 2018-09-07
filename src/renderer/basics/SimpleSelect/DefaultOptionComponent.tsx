import React from "react";
import { BaseOptionType } from "renderer/basics/SimpleSelect";
import styled from "renderer/styles";
import { T } from "renderer/t";

export interface OptionComponentProps<OptionType> {
  option: OptionType;
}

const DefaultOptionDiv = styled.div`
  display: flex;
  flex-flow: row;
  align-items: center;
`;

export default class DefaultOptionComponent<
  OptionType extends BaseOptionType
> extends React.PureComponent<OptionComponentProps<OptionType>> {
  render() {
    const { option } = this.props;
    return <DefaultOptionDiv>{T(option.label)}</DefaultOptionDiv>;
  }
}
