import * as React from "react";
import { connect } from "./connect";

import format from "./format";

import Button from "./basics/button";
import Filler from "./basics/filler";
import { IDispatch } from "../constants/action-types";

import { IActionOpts } from "./game-actions/list-secondary-actions";

import styled from "./styles";

const StyledButton = styled(Button)`
  margin: 0 4px;
`;

class Action extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { dispatch, opts } = this.props;
    const { action, icon, label, type = "action" } = opts;

    const textLabel = "" + label;

    if (type === "separator") {
      return <Filler />;
    }

    return (
      <StyledButton
        key={textLabel}
        discreet
        icon={icon}
        onClick={() => dispatch(action)}
        label={format(label)}
      />
    );
  }
}

interface IProps {
  opts: IActionOpts;
}

interface IDerivedProps {
  dispatch: IDispatch;
}

export default connect<IProps>(Action, {
  dispatch: dispatch => ({ dispatch }),
});
