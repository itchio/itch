
import * as React from "react";

class InputRow extends React.Component {
  componentDidMount() {
    if (this.props.autofocus) {
      this.refs.input.getDOMNode().focus();
    }
  }

  render() {
    return <div className="input_row">
      <label>
        <div className="label">{this.props.label}</div>
        <input type={this.props.type || "text"} ref="input" disabled={this.props.disabled && "disabled"}/>
      </label>
    </div>;
  }

  // non-React methods
  value() {
    return this.refs.input.getDOMNode().value;
  }
};

export {InputRow};

