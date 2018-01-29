import * as React from "react";
import { connect } from "./connect";

import * as actions from "../actions";
import { dispatcher } from "../constants/action-types";

import IconButton from "./basics/icon-button";

import styled from "./styles";
import { darken } from "polished";

import format, { formatString } from "./format";
import { InjectedIntl, injectIntl } from "react-intl";

const HiddenIndicatorDiv = styled.div`
  background: ${props => props.theme.meatBackground};
  box-shadow: 0 0 2px 0 ${props => darken(0.2, props.theme.meatBackground)};
  border-radius: 4px 0 0 0;
  position: fixed;
  right: 0;
  bottom: 0;
  padding: 8px;
  color: ${props => props.theme.secondaryText};

  display: flex;
  align-items: center;
`;

class HiddenIndicator extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { intl, tab, count, clearFilters } = this.props;

    if (!count) {
      return null;
    }

    return (
      <HiddenIndicatorDiv>
        <IconButton
          className="indicator-clear-filters"
          icon="delete"
          hint={formatString(intl, ["grid.clear_filters"])}
          onClick={() => clearFilters({ tab })}
        />{" "}
        {format(["grid.hidden_count", { count }])}
      </HiddenIndicatorDiv>
    );
  }
}

interface IProps {
  tab: string;
  count: number;
}

interface IDerivedProps {
  clearFilters: typeof actions.clearFilters;

  intl: InjectedIntl;
}

export default connect<IProps>(injectIntl(HiddenIndicator), {
  dispatch: dispatch => ({
    clearFilters: dispatcher(dispatch, actions.clearFilters),
  }),
});
