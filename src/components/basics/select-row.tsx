
import * as React from "react";

import {map} from "underscore";

/**
 * A drop-down you can select from
 */
class SelectRow extends React.PureComponent<ISelectRowProps, void> {
  refs: {
    input: HTMLInputElement;
  };

  constructor (props: ISelectRowProps) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }

  onChange (event: React.FormEvent<HTMLSelectElement>) {
    const {onChange} = this.props;
    if (onChange) {
      onChange(event.currentTarget.value);
    }
  }

  render () {
    let options = this.props.options;
    let value = this.props.value;

    const optionTags = map(options, (option, index) =>
      <option value={option.value}>{option.label}</option>,
    );

    return <div className="select-row">
      <select ref="input" value={value} onChange={this.onChange}>
        {optionTags}
      </select>
    </div>;
  }

  value () {
    return this.refs.input.value;
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
