
import * as React from "react";
import {connect} from "./connect";
import {createStructuredSelector} from "reselect";
import * as invariant from "invariant";

import {map} from "underscore";

import NiceAgo from "./nice-ago";

import * as actions from "../actions";

import {ILocalizer} from "../localizer";
import {IState, IHistoryItem, IHistoryItemOption} from "../types";
import {IDispatch} from "../constants/action-types";

class History extends React.Component<IHistoryProps, void> {
  render () {
    const {t, pickOption, items} = this.props;

    return <ul className="history-page">
    {map(items, (item) => {
      const {label, date, id, options = []} = item;
      return <li key={id} className="history-item">
        <div className="item-description">
          {t.format(label)}
          <div className="timeago">
            <NiceAgo date={date}/>
          </div>
        </div>
        <div className="item-options">
          {map(options, (option) => {
            return <div className="item-option" onClick={(e) => pickOption(id, option)}>
              {t.format(option.label)}
            </div>;
          })}
        </div>
      </li>;
    })}
    </ul>;
  }
}

interface IHistoryProps {
  items: IHistoryItem[];

  t: ILocalizer;
  pickOption(itemId: string, option: IHistoryItemOption): void;
}

const mapStateToProps = createStructuredSelector({
  items: (state: IState) => state.history.itemsByDate,
});

const mapDispatchToProps = (dispatch: IDispatch) => ({
  pickOption: (itemId: string, option: IHistoryItemOption) => {
    invariant(itemId, "have item id");
    if (option.action) {
      dispatch(option.action);
    }
    dispatch(actions.dismissHistoryItem({id: itemId}));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(History);
