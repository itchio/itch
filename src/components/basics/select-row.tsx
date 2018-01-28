import * as React from "react";

import { map } from "underscore";
import styled from "../styles";

const Select = styled.select`
  border: none;
  padding: 6px 8px;
  background: ${props => props.theme.sidebarBackground};
  border-radius: 4px;
  color: ${props => props.theme.baseText};
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
`;

/**
 * A drop-down you can select from
 */
class SelectRow extends React.PureComponent<ISelectRowProps> {
  element: HTMLSelectElement;

  constructor(props: ISelectRowProps) {
    super(props);
  }

  onChange = (event: React.FormEvent<HTMLSelectElement>) => {
    const { onChange } = this.props;
    if (onChange) {
      onChange(event.currentTarget.value);
    }
  };

  render() {
    let options = this.props.options;
    let value = this.props.value;

    const optionTags = map(options, (option, index) => (
      <option key={index} value={option.value}>
        {option.label}
      </option>
    ));

    return (
      <div className="select-row">
        <Select
          innerRef={this.gotElement}
          value={value}
          onChange={this.onChange}
        >
          {optionTags}
        </Select>
      </div>
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

interface ISelectOption {
  label: string;
  value: string;
}

interface ISelectRowProps {
  options: ISelectOption[];
  value?: string;
  onChange?(value: string): void;
}

export default SelectRow;
