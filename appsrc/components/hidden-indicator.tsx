
import * as React from "react";
import {connect, I18nProps} from "./connect";

import * as actions from "../actions";
import {dispatcher} from "../constants/action-types";

import Icon from "./icon";

class HiddenIndicator extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, tab, count, clearFilters} = this.props;

    if (count === 0) {
      return null;
    }

    return <div className="hidden-count">
      {t("grid.hidden_count", {count})}
      {" "}
      <span className="clear-filters" data-rh-at="top" data-rh={t("grid.clear_filters")}
          onClick={() => clearFilters({tab})}>
        <Icon icon="delete"/>
      </span>
    </div>;
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
