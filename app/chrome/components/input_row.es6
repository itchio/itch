
import {DOM, Component, createFactory} from "react";
var {div, label, input} = DOM;

var InputRowClass = class InputRow extends Component {
  componentDidMount() {
    if (this.props.autofocus) {
      this.refs.input.getDOMNode().focus();
    }
  }

  render() {
    return div({className: "input_row"},
      label({},
        div({className: "label"}, this.props.label),
        input({
          type: this.props.type || "text",
          ref: "input",
          disabled: this.props.disabled && "disabled"
        })
      )
    );
  }

  // non-React methods
  value() {
    return this.refs.input.getDOMNode().value;
  }
};

var InputRow = createFactory(InputRowClass);

export { InputRow };

