import * as React from "react";
import { connect } from "./connect";

import { formatString } from "./format";

import Button from "./basics/button";
import Filler from "./basics/filler";
import { IDispatch } from "../constants/action-types";

import { IActionOpts } from "./game-actions/list-secondary-actions";

import styled from "./styles";
import { InjectedIntl, injectIntl } from "react-intl";

const StyledButton = styled(Button)`
  margin: 0 4px;
`;

class Action extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { intl, dispatch, opts } = this.props;
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
        label={formatString(intl, label)}
      />
    );
  }
}

interface IProps {
  opts: IActionOpts;
}

interface IDerivedProps {
  dispatch: IDispatch;
  intl: InjectedIntl;
}

export default connect<IProps>(injectIntl(Action), {
  dispatch: dispatch => ({ dispatch }),
});
