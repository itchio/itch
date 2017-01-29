
import * as React from "react";

import {connect} from "./connect";

import * as actions from "../actions";
import {IAction, dispatcher} from "../constants/action-types";

import {ILocalizer} from "../localizer";

import Icon from "./icon";

class HiddenIndicator extends React.Component<IHiddenIndicatorProps, void> {
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

interface IHiddenIndicatorProps {
  tab: string;
  count: number;

  t: ILocalizer;

  clearFilters: typeof actions.clearFilters;
}

const mapStateToProps = () => ({});

const mapDispatchToProps = (dispatch: (action: IAction<any>) => void) => ({
  clearFilters: dispatcher(dispatch, actions.clearFilters),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(HiddenIndicator);
