
import * as React from "react";
import {connect, I18nProps} from "./connect";

import * as actions from "../actions";
import {dispatcher} from "../constants/action-types";

import IconButton from "./basics/icon-button";

import styled from "./styles";
import {darken} from "polished";

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

class HiddenIndicator extends React.PureComponent<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, tab, count, clearFilters} = this.props;

    if (count === 0) {
      return null;
    }

    return <HiddenIndicatorDiv>
      <IconButton
        className="indicator-clear-filters"
        icon="delete"
        hint={t("grid.clear_filters")}
        onClick={() => clearFilters({tab})}/>
      {" "}
      {t("grid.hidden_count", {count})}
    </HiddenIndicatorDiv>;
  }
}

interface IProps {
  tab: string;
  count: number;
}

interface IDerivedProps {
  clearFilters: typeof actions.clearFilters;
}

export default connect<IProps>(HiddenIndicator, {
  dispatch: (dispatch) => ({
    clearFilters: dispatcher(dispatch, actions.clearFilters),
  }),
});
