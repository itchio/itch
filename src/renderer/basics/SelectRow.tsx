import { ILocalizedString } from "common/types";
import React from "react";
import { InjectedIntl, injectIntl } from "react-intl";
import styled from "renderer/styles";
import { TString } from "renderer/t";
import { map } from "underscore";

const SelectRowDiv = styled.div`
  display: inline-block;
`;

const Select = styled.select`
  border: none;
  padding: 6px 8px;
  margin-left: 2px;
  background: ${props => props.theme.itemBackground};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  color: ${props => props.theme.baseText};
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
`;

/**
 * A drop-down you can select from
 */
class SelectRow extends React.PureComponent<ISelectRowProps & DerivedProps> {
  element: HTMLSelectElement;

  constructor(props: SelectRow["props"], context) {
    super(props, context);
  }

  onChange = (event: React.FormEvent<HTMLSelectElement>) => {
    const { onChange } = this.props;
    if (onChange) {
      onChange(event.currentTarget.value);
    }
  };

  render() {
    const { options, value, intl } = this.props;

    const optionTags = map(options, (option, index) => (
      <option key={index} value={option.value}>
        {TString(intl, option.label)}
      </option>
    ));

    return (
      <SelectRowDiv>
        <Select
          innerRef={this.gotElement}
          value={value}
          onChange={this.onChange}
        >
          {optionTags}
        </Select>
      </SelectRowDiv>
    );
  }

  gotElement = (element: HTMLSelectElement) => {
    this.element = element;
  };

  value() {
    if (this.element) {
      return this.element.value;
    } else {
      return null;
    }
  }
}

export interface ISelectOption {
  label: ILocalizedString;
  value: string;
}

interface ISelectRowProps {
  options: ISelectOption[];
  value?: string;
  onChange?(value: string): void;
}

interface DerivedProps {
  intl: InjectedIntl;
}

export default injectIntl(SelectRow);
